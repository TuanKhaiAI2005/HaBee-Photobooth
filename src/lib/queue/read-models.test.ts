import { describe, expect, it, vi } from "vitest";
import { getAdminRoomQueue, listStaffRooms, mapStaffTicket, type AdminQueueTicket } from "@/lib/queue/read-models";

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

  it("selects and exposes only the in-service queue number for the staff room list", async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: "room-1",
        name: "Room 1",
        color: "#ffffff",
        status: "ACTIVE",
        defaultDurationMinutes: 15,
        queueTickets: [
          { id: "ticket-called", status: "CALLED", queueNumber: 13, expectedEndAt: null },
          { id: "ticket-current", status: "IN_SERVICE", queueNumber: 12, expectedEndAt: null },
        ],
      },
      {
        id: "room-2",
        name: "Room 2",
        color: "#ffffff",
        status: "ACTIVE",
        defaultDurationMinutes: 15,
        queueTickets: [{ id: "ticket-called", status: "CALLED", queueNumber: 7, expectedEndAt: null }],
      },
      {
        id: "room-3",
        name: "Room 3",
        color: "#ffffff",
        status: "ACTIVE",
        defaultDurationMinutes: 15,
        queueTickets: [],
      },
      {
        id: "room-4",
        name: "Room 4",
        color: "#ffffff",
        status: "ACTIVE",
        defaultDurationMinutes: 15,
        queueTickets: [
          { id: "legacy-current", status: "IN_SERVICE", queueNumber: null, expectedEndAt: null },
          { id: "ticket-called", status: "CALLED", queueNumber: 9, expectedEndAt: null },
        ],
      },
    ]);

    const result = await listStaffRooms({ room: { findMany } } as never);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          queueTickets: expect.objectContaining({
            select: expect.objectContaining({ queueNumber: true }),
          }),
        }),
      }),
    );
    expect(result.rooms.map((room) => room.currentQueueNumber)).toEqual([12, null, null, null]);
    expect(result.rooms.map((room) => room.hasCalled)).toEqual([true, true, false, true]);
  });
});
