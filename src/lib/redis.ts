import { env } from "@/config/env";
import logger from "@/utils/logger";
import Redis from "ioredis";

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    if (times > 3) {
      logger.error("Redis: max retries reached, giving up");
      return null;
    }
    return Math.min(times * 200, 2000);
  },
});

redis.on("connect", () => {
  logger.info("Redis: connected");
});

redis.on("error", (err) => {
  logger.error({ err }, "Redis: connection error");
});

redis.on("close", () => {
  logger.warn("Redis: connection closed");
});

export default redis;
