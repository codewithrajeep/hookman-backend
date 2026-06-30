import { AppError } from "@/errors";
import { authRepository } from "./auth.repository";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";

export const authService = {
  register: async (data: { name: string; email: string; password: string }) => {
    const existing = await authRepository.findByEmail(data.email);
    if (existing) throw new AppError("Email already in use", 409);
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await authRepository.create({
      ...data,
      password: hashedPassword,
    });
    const { password: _password, ...safeUser } = user;
    return { user: safeUser };
  },
  login: async (data: { email: string; password: string }) => {
    const user = await authRepository.findByEmail(data.email);
    if (!user) throw new AppError("Invalid credentials", 401);
    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) throw new AppError("Invalid credentials", 401);
    const token = jwt.sign({ id: user.id }, env.JWT_SECRET, {
      expiresIn: "7d",
    });
    const { password: _password, ...safeUser } = user;
    return { user: safeUser, token };
  },
};
