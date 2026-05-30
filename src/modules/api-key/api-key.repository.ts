import prisma from "@/lib/prisma";

export const apiKeyRepository = {
  create: async (data: {
    key: string;
    prefix: string;
    name: string;
    userId: string;
  }) => {
    return prisma.apiKey.create({
      data: data,
    });
  },
  findByPrefix: async (prefix: string) => {
    return prisma.apiKey.findUnique({
      where: { prefix },
    });
  },
  findAllByUserId: async (userId: string) => {
    return prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        prefix: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });
  },
  findById: async (id: string) => {
    return prisma.apiKey.findUnique({
      where: { id },
    });
  },
  delete: async (id: string) => {
    return prisma.apiKey.delete({
      where: { id },
    });
  },
  updateLastUsed: async (id: string) => {
    return prisma.apiKey.update({
      where: { id },
      data: {
        lastUsedAt: new Date(),
      },
    });
  },
};
