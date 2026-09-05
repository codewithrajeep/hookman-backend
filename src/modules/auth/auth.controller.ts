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
      // set a cookie with the token
      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
      });
      return res.status(200).json({
        success: true,
        message: "User logged in successfully",
        data: { user: result.user }, // we don't send the token in the response body
      });
    } catch (err) {
      next(err);
    }
  },
  logout: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // clear the token cookie
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });
      return res.status(200).json({
        success: true,
        message: "User logged out successfully",
      });
    } catch (err) {
      next(err);
    }
  },
};
