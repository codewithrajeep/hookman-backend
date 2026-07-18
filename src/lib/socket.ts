import logger from "@/utils/logger";
import { Server as HttpServer } from "http";
import { Server } from "socket.io";

let io: Server;
export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    }
  });
  io.on("connection", (socket: import("socket.io").Socket) => {
    logger.info({ socketId: socket.id }, "Client connected.");
    // client sends their userId to join their own room
    // only events for that userId wil be pushed to them
    socket.on("join", (userId: string) => {
      socket.join(userId);
      logger.info({ socketId: socket.id, userId }, "Client joined room.");
    });
    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "Client disconnected.");
    });
  });
  return io;
};

// called by delivery.service.ts to emit events safe to call after initSocket
export const getId = (): Server => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
