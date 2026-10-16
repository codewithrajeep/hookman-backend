import { Queue } from "bullmq";
import { env } from "@/config/env";
import IoRedis from "ioredis";
import logger from "@/utils/logger";

// Redis client with resilient reconnection
// maxRetriesPerRequest: null is required by BullMQ workers.
export const connection = new IoRedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  // Exponential backoff capped at 5s. Never gives up - the worker
  // auto-recovers when redis comes back online
  retryStrategy(times) {
    return Math.min(times * 500, 5000);
  },
  // Give up on a single connection attempt after 10s.
  connectTimeout: 10_000,
});
// Throttle error logs - ioredis emits 'error' on every reconnect attempt.
// Logging every one would flood the terminal.
let lastErrorLogAt = 0;
const ERROR_LOG_INTERVAL_MS = 30_000;
connection.on("error", (err) => {
  const now = Date.now();
  if (now - lastErrorLogAt > ERROR_LOG_INTERVAL_MS) {
    logger.error({ message: err.message }, "Redis connection error.");
    lastErrorLogAt = now;
  }
});
connection.on("ready", () => {
  logger.info("Redis connection ready");
});
connection.on("reconnecting", () => {
  logger.warn("Redis reconnecting....");
});

export const webhookQueue = new Queue("webhook-delivery", {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 30_000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});
