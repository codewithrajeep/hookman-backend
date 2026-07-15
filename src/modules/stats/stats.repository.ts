import prisma from "@/lib/prisma";

export const statsRepository = {
  // Overall stats for a user — counts events grouped by status
  getOverallStatsByUserId: async (userId: string) => {
    const eventCounts = await prisma.event.groupBy({
      by: ["status"],
      where: {
        endpoint: { userId },
      },
      _count: { id: true },
    });
    const totalAttempts = await prisma.deliveryAttempt.count({
      where: {
        event: {
          endpoint: { userId },
        },
      },
    });
    const totalDeadLetters = await prisma.deadLetterEvent.count({
      where: {
        endpoint: { userId },
      },
    });
    return { eventCounts, totalAttempts, totalDeadLetters };
  },
  // Per-endpoint stats — same queries but scoped to one endpointId
  getStatsByEndpointId: async (endpointId: string) => {
    const eventCounts = await prisma.event.groupBy({
      by: ["status"],
      where: { endpointId },
      _count: { id: true },
    });
    const totalAttempts = await prisma.deliveryAttempt.count({
      where: {
        event: { endpointId },
      },
    });
    const totalDeadLetters = await prisma.deadLetterEvent.count({
      where: { endpointId },
    });
    return { eventCounts, totalAttempts, totalDeadLetters };
  },
};
