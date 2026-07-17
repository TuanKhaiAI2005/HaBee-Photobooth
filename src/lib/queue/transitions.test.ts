import type { QueueTicketStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { assertTicketTransition, canTransitionTicket } from "@/lib/queue/transitions";

const validTransitions: Array<[QueueTicketStatus, QueueTicketStatus]> = [
  ["WAITING", "CALLED"],
  ["WAITING", "CANCELLED"],
  ["CALLED", "IN_SERVICE"],
  ["CALLED", "CANCELLED"],
  ["CALLED", "NO_SHOW"],
  ["IN_SERVICE", "COMPLETED"],
];

const invalidTransitions: Array<[QueueTicketStatus, QueueTicketStatus]> = [
  ["WAITING", "IN_SERVICE"],
  ["WAITING", "COMPLETED"],
  ["CALLED", "COMPLETED"],
  ["IN_SERVICE", "CANCELLED"],
  ["COMPLETED", "WAITING"],
  ["CANCELLED", "WAITING"],
  ["NO_SHOW", "CALLED"],
  ["WAITING", "WAITING"],
];

describe("queue ticket transitions", () => {
  it.each(validTransitions)("allows %s to %s", (from, to) => {
    expect(canTransitionTicket(from, to)).toBe(true);
    expect(() => assertTicketTransition(from, to)).not.toThrow();
  });

  it.each(invalidTransitions)("blocks %s to %s", (from, to) => {
    expect(() => assertTicketTransition(from, to)).toThrow();
  });
});
