import { AppError, ForbiddenError, NotFoundError } from "@/errors";
import { EndpointRepository } from "./endpoint.repository";
import { Prisma } from "@/generated/prisma";
import crypto from "crypto";

export const EndpointService = {
  create: async (data: { name: string; url: string }, userId: string) => {
    const existingEndpoint = await EndpointRepository.findByUrlandUserId(
      data.url,
      userId,
    );
    if (existingEndpoint) {
      throw new AppError("Endpoint with this URL already exists", 409);
    }
    const secret = crypto.randomBytes(32).toString("hex");
    const endpoint = await EndpointRepository.create({
      ...data,
      secret,
      user: { connect: { id: userId } },
    });
    return endpoint;
  },
  listAllByUserId: async (userId: string) => {
    const endpoints = await EndpointRepository.findAllByUserId(userId);
    if (!endpoints) {
      throw new NotFoundError("No endpoints found");
    }
    return endpoints;
  },
  listById: async (id: string) => {
    const endpoint = await EndpointRepository.findById(id);
    if (!endpoint) {
      throw new NotFoundError("Endpoint not found");
    }
    return endpoint;
  },
  update: async (
    id: string,
    userId: string,
    data: Prisma.EndpointUpdateInput,
  ) => {
    const endpoint = await EndpointRepository.findById(id);
    if (!endpoint) throw new NotFoundError("Endpoint not found");
    if (endpoint.userId !== userId) throw new ForbiddenError("Access denied");
    return await EndpointRepository.update(id, data);
  },
  delete: async (id: string, userId: string) => {
    const endpoint = await EndpointRepository.findById(id);
    if (!endpoint) throw new NotFoundError("Endpoint not found");
    if (endpoint.userId !== userId) throw new ForbiddenError("Access denied");
    await EndpointRepository.delete(id);
    return endpoint;
  },
};
