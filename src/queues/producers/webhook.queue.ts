import { webhookQueue } from "../index";

interface WebhookJobData {
  eventId: string;
  endpointId: string;
  url: string;
  secret: string;
  payload: Record<string, unknown>;
}

export const addWebhookJob = async (data: WebhookJobData) => {
  return await webhookQueue.add("deliver", data)
}
