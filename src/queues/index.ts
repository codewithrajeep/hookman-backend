import { Queue } from "bullmq";
import { env } from "@/config/env";
import IoRedis from "ioredis"

// connect to redis
export const connection = new IoRedis(env.REDIS_URL, {
  maxRetriesPerRequest: null
})

export const webhookQueue = new Queue("webhook-delivery", {
  connection, defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 30_000
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 }
  }
})
