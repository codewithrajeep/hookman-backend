import prisma from "@/lib/prisma";

export const deliveryRepository = {
  createDeliveryAttempt: async (data: {
    eventId: string;
    attemptNumber: number;
    statusCode: number | null;
    responseBody: string | null;
    success: boolean;
  }) => {
    return await prisma.deliveryAttempt.create({
      data: {
        eventId: data.eventId,
        attemptNumber: data.attemptNumber,
        statusCode: data.statusCode,
        responseBody: data.responseBody,
        success: data.success
      }
    })
  },
  createDeadLetterEvent: async (data: {
    eventId: string;
    endpointId: string;
    payload: Record<string, string>;
    reason: string;
  }) => {
    return await prisma.deadLetterEvent.create({
      data: {
        eventId: data.eventId,
        endpointId: data.endpointId,
        payload: data.payload,
        reason: data.reason
      }
    })
  },
  updateEventStatus: async (
    eventId: string,
    status: "DELIVERED" | "FAILED"
  ) => {
    return await prisma.event.update({
      where: { id: eventId },
      data: { status }
    })
  }
}
