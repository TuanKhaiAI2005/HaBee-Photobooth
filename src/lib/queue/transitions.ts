import type { QueueTicketStatus } from "@prisma/client";

export class QueueTransitionError extends Error {
  constructor(message = "Trạng thái vé không hợp lệ cho thao tác này.") {
    super(message);
    this.name = "QueueTransitionError";
  }
}

export const terminalTicketStatuses: QueueTicketStatus[] = ["COMPLETED", "CANCELLED", "NO_SHOW"];

const allowedTransitions = new Map<QueueTicketStatus, QueueTicketStatus[]>([
  ["WAITING", ["CALLED", "CANCELLED"]],
  ["CALLED", ["IN_SERVICE", "CANCELLED", "NO_SHOW"]],
  ["IN_SERVICE", ["COMPLETED"]],
  ["COMPLETED", []],
  ["CANCELLED", []],
  ["NO_SHOW", []],
]);

export function canTransitionTicket(from: QueueTicketStatus, to: QueueTicketStatus): boolean {
  return allowedTransitions.get(from)?.includes(to) ?? false;
}

export function assertTicketTransition(from: QueueTicketStatus, to: QueueTicketStatus): void {
  if (from === to) {
    throw new QueueTransitionError("Vé đã ở trạng thái này.");
  }

  if (terminalTicketStatuses.includes(from)) {
    throw new QueueTransitionError("Vé đã kết thúc, không thể cập nhật tiếp.");
  }

  if (!canTransitionTicket(from, to)) {
    throw new QueueTransitionError(`Không thể chuyển vé từ ${from} sang ${to}.`);
  }
}



