import { env } from "@/config/env";
import { UnauthorizedError } from "@/errors";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { authRepository } from "./auth.repository";

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Prefer cookie-based auth (browser). Fall back to Bearer for
    // programmatic access (curl, API keys, mobile)
    let token = req.cookies?.token as string | undefined;
    if (!token) {
      const authHeader = req.headers["authorization"];
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }
    if (!token) {
      throw new UnauthorizedError(
        "You're not authorized to access this resource.",
      );
    }
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (typeof payload === "string" || typeof payload.id !== "string") {
      throw new UnauthorizedError("Invalid token.");
    }
    const user = await authRepository.findById(payload.id);
    if (!user) throw new UnauthorizedError("User not found.");
    const { password: _password, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError("Token expired."));
    } else if (err instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError("Invalid token."));
    } else {
      next(err);
    }
  }
};
