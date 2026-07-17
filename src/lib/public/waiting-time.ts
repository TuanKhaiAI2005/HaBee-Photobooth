import type { QueueTicketStatus } from "@prisma/client";

export const activeTicketStatuses: QueueTicketStatus[] = ["WAITING", "CALLED", "IN_SERVICE"];
export const cancellableTicketStatuses: QueueTicketStatus[] = ["WAITING", "CALLED"];

export function estimateWaitingMinutes(activeTicketsAhead: number, durationMinutes: number): number {
  return Math.max(0, activeTicketsAhead) * durationMinutes;
}
