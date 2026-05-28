import { NextFunction, Request, Response } from "express";
import { loginSchema, registerSchema } from "./auth.schema";
import { authService } from "./auth.service";

export const authController = {
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = registerSchema.parse(req.body);
      const result = await authService.register(body);
      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = loginSchema.parse(req.body);
      const result = await authService.login(body);
      return res.status(200).json({
        success: true,
        message: "User logged in successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
};
