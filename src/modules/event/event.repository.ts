import { Prisma } from "@/generated/prisma"
import prisma from "@/lib/prisma"

export const eventRepository = {
  create: async (data: Prisma.EventCreateInput) => {
    return await prisma.event.create({
      data,
    })
  },
  findAll: async (endpointId: string) => {
    return await prisma.event.findMany({
      where: {
        endpointId,
      },
    })
  },
  findById: async (id: string) => {
    return await prisma.event.findUnique({
      where: {
        id,
      },
    })
  },
  updateStatus: async (id: string, status: "PENDING" | "DELIVERING" | "DELIVERED" | "FAILED") => {
    return await prisma.event.update({
      where: {
        id,
      },
      data: {
        status,
      },
    })
  },
  // Todo: find event by user (for dashboard listing)
}
