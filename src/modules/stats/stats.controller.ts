import { UnauthorizedError } from "@/errors";
import { NextFunction, Request, Response } from "express";
import { statsService } from "./stats.service";

export const statsController = {
  getOverallStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError("User not authenticated");
      const result = await statsService.getOverallStats(userId);
      return res.status(200).json({
        success: true,
        message: "Overall stats retreived successfully",
        data: result
      })
    } catch (err) {
      next(err);
    }
  },
  getStatsByEndpoint: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError("User not authenticated");
      const { endpointId } = req.params;
      const result = await statsService.getStatsByEndpoint(endpointId as string, userId);
      return res.status(200).json({
        success: true,
        message: "Endpoint stats retreived successfully",
        data: result
      })
    } catch (err) {
      next(err);
    }
  }
}
