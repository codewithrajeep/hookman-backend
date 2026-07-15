import { NotFoundError } from "@/errors";
import { endpointRepository } from "../endpoint/endpoint.repository";
import { statsRepository } from "./stats.repository";

// shapes the raw groupBy result into a clean readable object
const formatEventCounts = (
  eventCounts: { status: string, _count: { id: number } }[]
) => {
  const counts = { PENDING: 0, DELIVERING: 0, DELIVERED: 0, FAILED: 0 };
  for (const row of eventCounts) {
    counts[row.status as keyof typeof counts] = row._count.id;
  }
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const successRate = total > 0
    ? Math.round((counts.DELIVERED / total) * 100)
    : 0;
  return { ...counts, total, successRate };
}

export const statsService = {
  getOverallStats: async (userId: string) => {
    const { eventCounts, totalAttempts, totalDeadLetters } = await statsRepository.getOverallStatsByUserId(userId);
    return {
      events: formatEventCounts(eventCounts),
      totalAttempts,
      totalDeadLetters
    }
  },
  getStatsByEndpoint: async (endpointId: string, userId: string) => {
    // verify endpoint belongs to user before fetching stats
    const endpoint = await endpointRepository.findById(endpointId);
    if (!endpoint || endpoint.userId !== userId) throw new NotFoundError("Endpoint not found");
    const { eventCounts, totalAttempts, totalDeadLetters } = await statsRepository.getStatsByEndpointId(endpointId);
    return {
      endpointId,
      events: formatEventCounts(eventCounts),
      totalAttempts,
      totalDeadLetters
    }
  }
}
