import prisma from "@/lib/prisma";

export const authRepository = {
  create: async (data: { name: string; email: string; password: string }) => {
    return await prisma.user.create({ data });
  },

  findByEmail: async (email: string) => {
    return await prisma.user.findUnique({ where: { email } });
  },

  findById: async (id: string) => {
    return await prisma.user.findUnique({ where: { id } });
  },
};