import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import { AppError } from "@/errors";
import logger from "@/utils/logger";
import authRoutes from "@/modules/auth/auth.routes";
import apiKeyRoutes from "@/modules/api-key/api-key.routes";
import endpointRoutes from "@/modules/endpoint/endpoint.routes";
import eventRoutes from "@/modules/event/event.routes";
import deliveryRoutes from "@/modules/delivery/delivery.routes";
import statsRoutes from "@/modules/stats/stats.routes";
import pinoHttp from "pino-http";

const app = express();
app.use(
  pinoHttp({
    customLogLevel: (_req, res) => {
      if (res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    serializers: {
      req(req) {
        return {
          method: req.method,
          url: req.url,
          ip:
            req.headers["x-forwarded-for"] ??
            req.socket?.remoteAddress ??
            "unknown",
          userAgent: req.headers["user-agent"],
          time: new Date().toLocaleTimeString(),
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(helmet());
const frontendUrl = process.env.FRONTEND_URL;
const allowedOrigins = [
  "http://localhost:3000",
  ...(frontendUrl ? [frontendUrl] : []),
];
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Allow-Origin",
    ],
  }),
);
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/api-keys", apiKeyRoutes);
app.use("/api/v1/endpoints", endpointRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/delivery", deliveryRoutes);
app.use("/api/v1/stats", statsRoutes);

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
