import { NextFunction, Request, Response } from "express";
import { endpointService } from "./endpoint.service";
import { NotFoundError, UnauthorizedError } from "@/errors";

export const endpointController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id
      if (!userId) throw new UnauthorizedError("User not authenticated");
      const { name, url } = req.body
      const result = await endpointService.create({ name, url }, userId)
      return res.status(201).json({
        success: true,
        message: "Endpoint created successfully",
        data: result
      })
    } catch (err) {
      next(err)
    }
  },
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError("User not authenticated");
      const result = await endpointService.listAllByUserId(userId);
      return res.status(200).json({
        success: true,
        message: "Endpoint URLs retrieved successfully",
        data: result,
      })
    } catch (err) {
      next(err)
    }
  },
  listById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) throw new NotFoundError("Endpoint not found");
      const result = await endpointService.listById(id as string);
      return res.status(200).json({
        success: true,
        message: "Endpoint URLs retrieved successfully",
        data: result
      })
    } catch (err) {
      next(err)
    }
  },
  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError("User not authenticated");
      const { id } = req.params;
      if (!id) throw new NotFoundError("Endpoint not found");
      const { name, url, isActive } = req.body;
      const updated = await endpointService.update(id as string, userId, { name, url, isActive });
      return res.status(200).json({
        success: true,
        message: "Endpoint URl updated",
        data: updated
      })
    } catch (err) {
      next(err)
    }
  },
  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError("User not authenticated");
      const { id } = req.params;
      if (!id) throw new NotFoundError("Endpoint not found");
      await endpointService.delete(id as string, userId);
      return res.status(200).json({
        success: true,
        message: "Endpoint deleted successfully"
      })
    } catch (err) {
      next(err)
    }
  }
}
