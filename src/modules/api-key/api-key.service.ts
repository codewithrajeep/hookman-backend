import crypto from "crypto";
import { apiKeyRepository } from "./api-key.repository";
import { CreateApiKeyInput } from "./api-key.schema";
import { ForbiddenError, NotFoundError } from "@/errors";

export const apiKeyService = {
  create: async (input: CreateApiKeyInput, userId: string) => {
    const rawKey = crypto.randomBytes(32).toString("hex");
    const fullKey = `hm_${rawKey}`;
    const prefix = fullKey.slice(0, 8);
    const hashedKey = crypto.createHash("sha256").update(fullKey).digest("hex");
    await apiKeyRepository.create({
      key: hashedKey,
      prefix: prefix,
      name: input.name,
      userId,
    });
    return { rawKey, prefix, name: input.name };
  },
  listByUser: async (userId: string) => {
    return apiKeyRepository.findAllByUserId(userId);
  },
  delete: async (id: string, userId: string) => {
    const apiKey = await apiKeyRepository.findById(id);
    if (!apiKey) throw new NotFoundError("API key not found.");
    if (apiKey.userId !== userId) throw new ForbiddenError("Access denied.");
    return await apiKeyRepository.delete(id);
  },
};
