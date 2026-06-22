import { Prisma } from "@/generated/prisma";
import prisma from "@/lib/prisma";

export const endpointRepository = {
  create: async (data: Prisma.EndpointCreateInput) => {
    return await prisma.endpoint.create({
      data,
    });
  },
  findByUrlandUserId: async (url: string, userId: string) => {
    return await prisma.endpoint.findFirst({
      where: { url, userId },
    });
  },
  findAllByUserId: async (userId: string) => {
    return await prisma.endpoint.findMany({
      where: { userId },
    });
  },
  findById: async (id: string) => {
    return await prisma.endpoint.findUnique({
      where: { id },
    });
  },
  update: async (id: string, data: Prisma.EndpointUpdateInput) => {
    return await prisma.endpoint.update({
      where: { id },
      data,
    });
  },
  delete: async (id: string) => {
    return await prisma.endpoint.delete({
      where: { id },
    });
  },
};
