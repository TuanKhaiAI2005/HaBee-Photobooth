import { describe, expect, it } from "vitest";
import { mapStaffTicket, type AdminQueueTicket } from "@/lib/queue/read-models";

function makeTicket(): AdminQueueTicket {
  return {
    id: "ticket-1",
    ticketCode: "A001",
    customerName: "Nguyen Van An",
    normalizedPhone: "0912345678",
    status: "WAITING",
    queuePosition: 1,
    calledAt: null,
    arrivalConfirmedAt: null,
    serviceStartedAt: null,
    expectedEndAt: null,
    cancelledAt: null,
    registeredAt: new Date("2026-07-28T00:00:00.000Z"),
  };
}

describe("staff ticket mapping", () => {
  it("exposes the full customer name while keeping the phone masked", () => {
    const staffTicket = mapStaffTicket(makeTicket());

    expect(staffTicket.customerName).toBe("Nguyen Van An");
    expect(staffTicket.maskedPhone).toBe("******5678");
    expect(staffTicket).not.toHaveProperty("normalizedPhone");
    expect(staffTicket).not.toHaveProperty("maskedName");
  });
});
