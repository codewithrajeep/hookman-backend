import { z } from "zod";

export const ApiKeySchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters long")
    .max(50, "Name must be at most 50 characters long"),
});

export type CreateApiKeyInput = z.infer<typeof ApiKeySchema>;
