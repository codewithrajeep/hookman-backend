import { z } from "zod";

export const CreateEventSchema = z.object({
  type: z.string().min(1, "Event type is required"),
  payload: z.record(z.string(), z.unknown()),
  endpointId: z.string().min(1, "Endpoint ID is required")
})

export type CreateEventInput = z.infer<typeof CreateEventSchema>;
