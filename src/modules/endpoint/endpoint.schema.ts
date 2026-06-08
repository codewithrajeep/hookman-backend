import { z } from "zod";

export const CreateEndpointSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters long")
        .max(50, "Name must be at most 50 characters long"),
    url: z.string().url("Invalid URL format").startsWith("https://", "URL must use HTTPS"),
});

export const UpdateEndpointSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters long")
        .max(50, "Name must be at most 50 characters long").optional(),
    url: z.string().url("Invalid URL format").startsWith("https://", "URL must use HTTPS"),
    isActive: z.boolean().optional(),
});

export type CreateEndpointInput = z.infer<typeof CreateEndpointSchema>;
export type UpdateEndpointInput = z.infer<typeof UpdateEndpointSchema>;