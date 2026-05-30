import { NextFunction, Request, Response } from "express";
import { apiKeyService } from "./api-key.service";
import { UnauthorizedError } from "@/errors";

export const apiKeyController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new Error("User not authenticated");
      const { name } = req.body;
      const result = await apiKeyService.create({ name }, userId);
      return res.status(201).json({
        success: true,
        message: "API key created successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError("User not authenticated.");
      const result = await apiKeyService.listByUser(userId);
      return res.status(200).json({
        success: true,
        message: "API keys retrieved successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError("User not authenticated.");
      const { id } = req.params as { id: string };
      if (!id) throw new UnauthorizedError("API key ID is required.");
      const result = await apiKeyService.delete(id, userId);
      return res.status(200).json({
        success: true,
        message: "API key deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  },
};
