import { describe, expect, it, vi } from "vitest";
import { getAdminRoomQueue, mapStaffTicket, type AdminQueueTicket } from "@/lib/queue/read-models";

function makeTicket(): AdminQueueTicket {
  return {
    id: "ticket-1",
    ticketCode: "A001",
    customerName: "Nguyen Van An",
    normalizedPhone: "0912345678",
    status: "WAITING",
    queuePosition: 1,
    queueNumber: 12,
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
    expect(staffTicket.queueNumber).toBe(12);
    expect(staffTicket).not.toHaveProperty("normalizedPhone");
    expect(staffTicket).not.toHaveProperty("maskedName");
  });

  it("keeps a null queue number for legacy tickets", () => {
    const staffTicket = mapStaffTicket({ ...makeTicket(), queueNumber: null });

    expect(staffTicket.queueNumber).toBeNull();
  });
});

describe("admin and staff queue query", () => {
  it("selects the stored queue number from QueueTicket", async () => {
    const findUnique = vi.fn().mockResolvedValue(null);

    await getAdminRoomQueue({ room: { findUnique } } as never, "room-1");

    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          queueTickets: expect.objectContaining({
            select: expect.objectContaining({ queueNumber: true }),
          }),
        }),
      }),
    );
  });
});
