import crypto from "crypto";
import { NotFoundError } from "@/errors";
import { DeliveryJobData } from "./delivery.schema";
import { deliveryRepository } from "./delivery.repository";
import { Prisma } from "@/generated/prisma";
import { addWebhookJob } from "@/queues/producers/webhook.queue";
import { getIO } from "@/lib/socket";

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_ATTEMPTS = 5;
// 408 (timeout) and 429 (rate limit) are intentionally excluded — they ARE retryable
const NON_RETRYABLE_STATUS_CODES = [400, 401, 403, 404, 410];
// ─── Helpers ──────────────────────────────────────────────────────────────────
const signPayload = (payload: Prisma.InputJsonValue, secret: string): string => {
  const body = JSON.stringify(payload);
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
};
const isRetryable = (statusCode: number | null): boolean => {
  if (statusCode === null) return true;
  return !NON_RETRYABLE_STATUS_CODES.includes(statusCode);
};

// Emits socket event to the user's room — non-fatal if socket not initialized
const emitToUser = (userId: string, event: string, data: unknown) => {
  try {
    getIO().to(userId).emit(event, data);
  } catch (_) {
    // socket not initialized yet — skip silently, don't crash delivery
  }
};

// ─── Service ──────────────────────────────────────────────────────────────────
export const deliveryService = {
  // Called by webhook.worker.ts on every job execution including retries
  processWebhookDelivery: async (data: DeliveryJobData, attemptsMade: number) => {
    const { eventId, endpointId, userId, url, secret, payload } = data;
    const attemptNumber = attemptsMade + 1;
    let statusCode: number | null = null;
    let responseBody: string | null = null;
    let success = false;
    // ── Step 1: Sign and POST ───────────────────────────────────────────────
    try {
      const signature = signPayload(payload, secret);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Hookman-Signature": `sha256=${signature}`,
          "X-Hookman-Attempt": String(attemptNumber),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      });
      statusCode = response.status;
      responseBody = await response.text();
      success = response.ok;
    } catch (err) {
      responseBody = err instanceof Error ? err.message : "Unknown network error";
      success = false;
    }
    // ── Step 2: Log attempt regardless of outcome ───────────────────────────
    await deliveryRepository.createDeliveryAttempt({
      eventId,
      attemptNumber,
      statusCode,
      responseBody,
      success,
    });
    // ── Step 3: Success path ────────────────────────────────────────────────
    if (success) {
      await deliveryRepository.updateEventStatus(eventId, "DELIVERED");
      emitToUser(userId, "delivery:success", {
        eventId,
        endpointId,
        attemptNumber,
        statusCode,
      });
      return;
    }
    // ── Step 4: Permanent failure path ──────────────────────────────────────
    const attemptsExhausted = attemptNumber >= MAX_ATTEMPTS;
    const retryable = isRetryable(statusCode);
    if (!retryable || attemptsExhausted) {
      const reason = !retryable ? "NON_RETRYABLE_STATUS" : "MAX_ATTEMPTS_EXHAUSTED";
      await deliveryRepository.createDeadLetterEvent({ eventId, endpointId, payload, reason });
      await deliveryRepository.updateEventStatus(eventId, "FAILED");
      emitToUser(userId, "delivery:failed", {
        eventId,
        endpointId,
        attemptNumber,
        statusCode,
        reason,
      });
      return;
    }
    // ── Step 5: Retryable — throw to trigger BullMQ retry ───────────────────
    throw new Error(
      `Delivery failed — status ${statusCode ?? "network error"}, attempt ${attemptNumber}/${MAX_ATTEMPTS}`
    );
  },
  // ─── Read methods (used by controller) ──────────────────────────────────────
  listAttemptsByEventId: async (eventId: string) => {
    return deliveryRepository.findAttemptsByEventId(eventId);
  },
  listDeadLettersByUserId: async (userId: string) => {
    return deliveryRepository.findDeadLettersByUserId(userId);
  },
  getDeadLetterByEventId: async (eventId: string) => {
    const result = await deliveryRepository.findDeadLetterByEventId(eventId);
    if (!result) throw new NotFoundError("Dead letter event not found");
    return result;
  },
  replayEvent: async (eventId: string, userId: string) => {
    const deadLetter = await deliveryRepository.findDeadLetterWithEndpoint(eventId);
    if (!deadLetter) throw new NotFoundError("Dead letter event not found");
    if (deadLetter.endpoint.userId !== userId) throw new NotFoundError("Dead letter event not found");
    await deliveryRepository.deleteDeadLetterEvent(eventId);
    await deliveryRepository.updateEventStatus(eventId, "PENDING");
    await addWebhookJob({
      eventId,
      endpointId: deadLetter.endpoint.id,
      userId: deadLetter.endpoint.userId, // carry userId for socket emit on retry
      url: deadLetter.endpoint.url,
      secret: deadLetter.endpoint.secret,
      payload: deadLetter.payload as Record<string, unknown>,
    });
  },
};