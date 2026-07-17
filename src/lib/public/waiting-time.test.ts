import { describe, expect, it } from "vitest";
import { estimateWaitingMinutes, activeTicketStatuses } from "@/lib/public/waiting-time";

describe("waiting time", () => {
  it("calculates basic waiting time by duration", () => {
    expect(estimateWaitingMinutes(3, 15)).toBe(45);
  });

  it("does not treat cancelled tickets as active", () => {
    expect(activeTicketStatuses).not.toContain("CANCELLED");
    expect(activeTicketStatuses).not.toContain("COMPLETED");
  });

  it("handles gaps by using people ahead count, not stored position", () => {
    const tickets = [
      { queuePosition: 1, status: "WAITING" },
      { queuePosition: 2, status: "CANCELLED" },
      { queuePosition: 4, status: "WAITING" },
    ] as const;
    const peopleAhead = tickets.filter((ticket) => ticket.queuePosition < 4 && activeTicketStatuses.includes(ticket.status)).length;

    expect(peopleAhead).toBe(1);
    expect(estimateWaitingMinutes(peopleAhead, 20)).toBe(20);
  });
});
