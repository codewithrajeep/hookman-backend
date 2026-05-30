import { UnauthorizedError } from "@/errors";
import { NextFunction, Request, Response } from "express";
import { apiKeyRepository } from "./api-key.repository";
import crypto from "crypto";
import { authRepository } from "../auth/auth.repository";

export const authenticateApiKey = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const rawKey = req.headers["x-api-key"] as string | undefined;
    if (!rawKey) {
      throw new UnauthorizedError("API key is missing.");
    }
    const prefix = rawKey.slice(0, 8);
    const apiKey = await apiKeyRepository.findByPrefix(prefix);
    if (!apiKey) throw new UnauthorizedError("Invalid API key.");
    const hashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");
    if (hashedKey !== apiKey.key) {
      throw new UnauthorizedError("Invalid API key.");
    }
    await apiKeyRepository.updateLastUsed(apiKey.id);
    const user = await authRepository.findById(apiKey.userId);
    if (!user) throw new UnauthorizedError("User not found.");
    const { password: _password, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      next(err);
    } else {
      next(err);
    }
  }
};
