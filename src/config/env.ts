import z from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
});

const _env = envSchema.safeParse(process.env);
if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  process.exit(1);
}

export const env = _env.data;
