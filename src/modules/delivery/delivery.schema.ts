import { z } from "zod";

export const DeliveryJobSchema = z.object({
  eventId: z.string(),
  endpointId: z.string().min(1, "Endpoint ID is required"),
  url: z.string().url("Invalid ULR format").startsWith("https://", "URL must use HTTPS"),
  secret: z.string(),
  payload: z.any()
})

export type DeliveryJobData = z.infer<typeof DeliveryJobSchema>;
