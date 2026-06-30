import { NextFunction, Request, Response } from "express";
import { eventService } from "./event.service";
import { NotFoundError, UnauthorizedError } from "@/errors";
import { CreateEventSchema } from "./event.schema";

export const eventController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = CreateEventSchema.parse(req.body);
      const result = await eventService.create(parsed);
      return res.status(200).json({
        success: true,
        message: "Event ingested successfully",
        data: result
      })
    } catch (err) {
      next(err);
    }
  },
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError("User not authenticated");
      const result = await eventService.listByUser(userId);
      return res.status(200).json({
        success: true,
        message: "Events retrieved successfully",
        data: result
      })
    } catch (err) {
      next(err);
    }
  },
  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) throw new NotFoundError("Event not  found");
      const result = await eventService.getById(id as string);
      return res.status(200).json({
        success: true,
        message: "Event retrieved successfully",
        data: result
      })
    } catch (err) {
      next(err)
    }
  }
}
