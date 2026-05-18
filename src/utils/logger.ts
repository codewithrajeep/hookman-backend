import pino from "pino";
import { env } from "@/config/env";
import { hostname } from "node:os";

const logger = pino({
  level: env.NODE_ENV === "development" ? "debug" : "info",
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    pid: process.pid,
    hostname: hostname(),
  },
});
export default logger;
