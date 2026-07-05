import crypto from "crypto";
import { DeliveryJobData } from "./delivery.schema";
import { deliveryRepository } from "./delivery.repository";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_ATTEMPTS = 5;

// These status codes will never succeed on retry — permanent client-side errors
// 408 (timeout) and 429 (rate limit) are intentionally excluded — they ARE retryable
const NON_RETRYABLE_STATUS_CODES = [400, 401, 403, 404, 410];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Signs the payload body with the endpoint's secret using HMAC-SHA256
// Receiver validates X-Hookman-Signature to confirm the webhook is genuine
const signPayload = (payload: Record<string, unknown>, secret: string): string => {
  const body = JSON.stringify(payload);
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
};

// null statusCode = network error (timeout, DNS fail, connection refused) = retryable
// Hard 4xx from NON_RETRYABLE list = permanent fail, no point retrying
const isRetryable = (statusCode: number | null): boolean => {
  if (statusCode === null) return true;
  return !NON_RETRYABLE_STATUS_CODES.includes(statusCode);
};

// ─── Main ─────────────────────────────────────────────────────────────────────

// Called by webhook.worker.ts on every job execution (including BullMQ retries)
// job.attemptsMade is passed in from the worker — 0-indexed by BullMQ
export const processWebhookDelivery = async (
  data: DeliveryJobData,
  attemptsMade: number
) => {
  const { eventId, endpointId, url, secret, payload } = data;

  // BullMQ gives 0-indexed attemptsMade — convert to 1-indexed for DB + logs
  const attemptNumber = attemptsMade + 1;

  let statusCode: number | null = null;
  let responseBody: string | null = null;
  let success = false;

  // ── Step 1: Sign and POST ─────────────────────────────────────────────────

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
      signal: AbortSignal.timeout(10_000), // 10s hard timeout per attempt
    });

    statusCode = response.status;
    responseBody = await response.text();
    success = response.ok; // true for 2xx only
  } catch (err) {
    // Network-level failure — no statusCode, log the error message as responseBody
    responseBody = err instanceof Error ? err.message : "Unknown network error";
    success = false;
  }

  // ── Step 2: Log this attempt regardless of outcome ────────────────────────

  await deliveryRepository.createDeliveryAttempt({
    eventId,
    attemptNumber,
    statusCode,
    responseBody,
    success,
  });

  // ── Step 3: Success path ──────────────────────────────────────────────────

  if (success) {
    await deliveryRepository.updateEventStatus(eventId, "DELIVERED");
    return; // clean return — BullMQ marks job as completed
  }

  // ── Step 4: Permanent failure path ───────────────────────────────────────

  const attemptsExhausted = attemptNumber >= MAX_ATTEMPTS;
  const retryable = isRetryable(statusCode);

  if (!retryable || attemptsExhausted) {
    const reason = !retryable
      ? "NON_RETRYABLE_STATUS"
      : "MAX_ATTEMPTS_EXHAUSTED";

    await deliveryRepository.createDeadLetterEvent({ eventId, endpointId, payload, reason });
    await deliveryRepository.updateEventStatus(eventId, "FAILED");
    return; // clean return — do NOT throw, BullMQ must not retry this
  }

  // ── Step 5: Retryable failure — throw to trigger BullMQ retry ────────────

  // BullMQ only retries a job when the worker throws.
  // The backoff delay between retries is configured in webhook.worker.ts.
  throw new Error(
    `Delivery failed — status ${statusCode ?? "network error"}, attempt ${attemptNumber}/${MAX_ATTEMPTS}`
  );
};
