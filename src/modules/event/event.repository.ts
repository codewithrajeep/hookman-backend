import { EventStatus, Prisma } from "@/generated/prisma"
import prisma from "@/lib/prisma"

export const eventRepository = {
  create: async (data: Prisma.EventCreateInput) => {
    return await prisma.event.create({
      data,
    })
  },
  findAllByEndpointId: async (endpointId: string) => {
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
  updateStatus: async (id: string, status: EventStatus) => {
    return await prisma.event.update({
      where: {
        id,
      },
      data: {
        status,
      },
    })
  },
  findAllByUserId: async (userId: string) => {
    return await prisma.event.findMany({
      where: {
        endpoint: {
          userId
        }
      },
      include: {
        endpoint: true
      }
    })
  }
}
