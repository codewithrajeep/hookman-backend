import { AppError, NotFoundError } from "@/errors";
import { endpointRepository } from "../endpoint/endpoint.repository";
import { CreateEventInput } from "./event.schema";
import { eventRepository } from "./event.repository";

export const eventService = {
  create: async (data: CreateEventInput) => {
    // validate endpoint exists
    const endpoint = await endpointRepository.findById(data.endpointId);
    if (!endpoint) throw new NotFoundError("Endpoint not found");
    // check if endpoint is active
    if (!endpoint.isActive) throw new AppError("Endpoint not active", 400);
    // create event with pending status
    const event = await eventRepository.create({
      type: data.type,
      payload: data.payload,
      status: "PENDING",
      endpoint: {
        connect: {
          id: data.endpointId
        }
      }
    });
    // TODO: enqueue for delivery
    return event;
  },
  listByEndpoint: async (endpointId: string) => {
    const events = await eventRepository.findAllByEndpointId(endpointId);
    return events;
  },
  getById: async (id: string) => {
    const event = await eventRepository.findById(id);
    if (!event) throw new NotFoundError("Event not found");
    return event;
  },
  listByUser: async (userId: string) => {
    return await eventRepository.findAllByUserId(userId);
  }
}
