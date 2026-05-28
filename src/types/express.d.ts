import { User } from "@/generated/prisma";

declare global {
  namespace Express {
    interface Request {
      user?: Omit<User, "password" | "refreshToken">;
    }
  }
}
