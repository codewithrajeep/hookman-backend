import { AppError } from "@/errors/AppError";
import { AuthRepository } from "./auth.repository";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";

export const AuthService = {
  register: async (data: { name: string; email: string; password: string }) => {
    const existing = await AuthRepository.findByEmail(data.email);
    if (existing) throw new AppError("Email already in use", 409);
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await AuthRepository.create({
      ...data,
      password: hashedPassword,
    });
    const { password, ...safeUser } = user;
    return { user: safeUser };
  },
  login: async (data: { email: string; password: string }) => {
    const user = await AuthRepository.findByEmail(data.email);
    if (!user) throw new AppError("Invalid credentials", 401);
    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) throw new AppError("Invalid credentials", 401);
    const token = jwt.sign({ id: user.id }, env.JWT_SECRET, {
      expiresIn: "7d",
    });
    const { password, ...safeUser } = user;
    return { user: safeUser, token };
  },
};
