import http from 'http'
import app from "./app";
import { env } from "@/config/env";
import logger from "@/utils/logger";
import { initSocket } from "./lib/socket";
import "@/queues/workers/webhook.worker"

const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(env.PORT, () => {
  logger.info(`Server running on http://localhost:${env.PORT}`);
});
