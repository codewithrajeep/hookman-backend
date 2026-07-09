import { NotFoundError, UnauthorizedError } from "@/errors";
import { NextFunction, Request, Response } from "express";
import { deliveryService } from "./delivery.service";

export const deliveryController = {
  // Returns all DeliveryAttempt rows for a given event shows retry history
  listAttempts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError("User not authenticated");
      const { eventId } = req.params;
      if (!eventId) throw new NotFoundError("Event not found");
      const result = await deliveryService.listAttemptsByEventId(eventId as string);
      return res.status(200).json({
        success: true,
        message: "Delivery attempts retrieved successfully",
        data: result,
      })
    } catch (err) {
      next(err);
    }
  },
  // Returns all DeadLetterEvent rows belonging to the authenticated user
  listDeadLetters: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError("User not authenticated");
      const result = await deliveryService.listDeadLettersByUserId(userId);
      return res.status(200).json({
        success: true,
        message: "Dead letters events retrieved successfully",
        data: result,
      })
    } catch (err) {
      next(err);
    }
  },
  // Returns the single DeadLetterEvent for a specific event(eventId is @unique in schema)
  getDeadLetter: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError("User not authenticated");
      const { eventId } = req.params;
      if (!eventId) throw new NotFoundError("Event not found");
      const result = await deliveryService.getDeadLetterByEventId(eventId as string);
      return res.status(200).json({
        success: true,
        message: "Dead letter event retrieved successfully",
        data: result,
      })
    } catch (err) {
      next(err);
    }
  }
}
