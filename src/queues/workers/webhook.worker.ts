import { DeliveryJobSchema } from "@/modules/delivery/delivery.schema";
import { deliveryService } from "@/modules/delivery/delivery.service";
import logger from "@/utils/logger";
import { Worker } from "bullmq";
import { connection } from "../index";

export const webhookWorker = new Worker(
  "webhook-delivery",
  async (job) => {
    // validate job.data shape at runtime before touching anything
    const data = DeliveryJobSchema.parse(job.data);
    logger.info(
      { jobId: job.id, eventId: data.eventId, attempt: job.attemptsMade + 1 },
      "Processing webhook delivery"
    );
    await deliveryService.processWebhookDelivery(data, job.attemptsMade);
  },
  {
    connection,
    concurrency: 10,
  }
);

// webhook lifecycle logs useful for debugging on Render
webhookWorker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Webhook delivery completed");
});
webhookWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "Webhook delivery failed");
});
webhookWorker.on("error", (err) => {
  logger.error({ err }, "Webhook worker error");
})
