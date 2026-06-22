import { AppError, ForbiddenError, NotFoundError } from "@/errors";
import { endpointRepository } from "./endpoint.repository";
import { Prisma } from "@/generated/prisma";
import crypto from "crypto";

export const endpointService = {
  create: async (data: { name: string; url: string }, userId: string) => {
    const existingEndpoint = await endpointRepository.findByUrlandUserId(
      data.url,
      userId,
    );
    if (existingEndpoint) {
      throw new AppError("Endpoint with this URL already exists", 409);
    }
    const secret = crypto.randomBytes(32).toString("hex");
    const endpoint = await endpointRepository.create({
      ...data,
      secret,
      user: { connect: { id: userId } },
    });
    return endpoint;
  },
  listAllByUserId: async (userId: string) => {
    const endpoints = await endpointRepository.findAllByUserId(userId);
    if (!endpoints) {
      throw new NotFoundError("No endpoints found");
    }
    return endpoints;
  },
  listById: async (id: string) => {
    const endpoint = await endpointRepository.findById(id);
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
    const endpoint = await endpointRepository.findById(id);
    if (!endpoint) throw new NotFoundError("Endpoint not found");
    if (endpoint.userId !== userId) throw new ForbiddenError("Access denied");
    return await endpointRepository.update(id, data);
  },
  delete: async (id: string, userId: string) => {
    const endpoint = await endpointRepository.findById(id);
    if (!endpoint) throw new NotFoundError("Endpoint not found");
    if (endpoint.userId !== userId) throw new ForbiddenError("Access denied");
    await endpointRepository.delete(id);
    return endpoint;
  },
};
