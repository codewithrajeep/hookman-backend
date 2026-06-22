import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import { AppError } from "@/errors/AppError";
import logger from "@/utils/logger";
import authRoutes from "@/modules/auth/auth.routes";
import apiKeyRoutes from "@/modules/api-key/api-key.routes";
import endpointRoutes from "@/modules/endpoint/endpoint.routes"

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/api-keys", apiKeyRoutes);
app.use("/api/v1/endpoints", endpointRoutes)

app.use((_req: Request, res: Response) => {
  res.status(404).json({ status: "error", message: "Route not found" });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  logger.error({ err }, "Unhandled error");
  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
});

export default app;
