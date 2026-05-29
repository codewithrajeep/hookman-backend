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
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError(
        "You're not authorized to access this resource.",
      );
    }
    const token = authHeader.split(" ")[1];
    if (!token) throw new UnauthorizedError("Invalid token.");
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    const user = await authRepository.findById(payload.userId);
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
