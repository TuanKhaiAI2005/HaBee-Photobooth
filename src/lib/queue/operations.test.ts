import { describe, expect, it } from "vitest";
import { autoCallNextTicketNearServiceEnd } from "@/lib/queue/operations";

function makePrisma({
  expectedEndAt,
  existingCalled = false,
  hasWaiting = true,
}: {
  expectedEndAt: Date | null;
  existingCalled?: boolean;
  hasWaiting?: boolean;
}) {
  const events: unknown[] = [];
  const updates: unknown[] = [];
  let findFirstCall = 0;

  const tx = {
    room: {
      async findUnique() {
        return { id: "room-id", status: "ACTIVE" };
      },
    },
    queueTicket: {
      async findFirst() {
        findFirstCall += 1;

        if (findFirstCall === 1) {
          return expectedEndAt ? { id: "in-service-ticket", expectedEndAt } : null;
        }

        if (findFirstCall === 2) {
          return existingCalled ? { id: "called-ticket" } : null;
        }

        return hasWaiting ? { id: "waiting-ticket", status: "WAITING" } : null;
      },
      async update(args: unknown) {
        updates.push(args);
        return { id: "waiting-ticket", roomId: "room-id", status: "CALLED" };
      },
    },
    queueEvent: {
      async create(args: unknown) {
        events.push(args);
        return args;
      },
    },
  };

  return {
    events,
    updates,
    async $transaction(callback: (transaction: typeof tx) => Promise<unknown>) {
      return callback(tx);
    },
  };
}

describe("autoCallNextTicketNearServiceEnd", () => {
  it("calls the nearest waiting ticket when the current service has two minutes left", async () => {
    const now = new Date("2026-07-17T10:00:00.000Z");
    const prisma = makePrisma({ expectedEndAt: new Date("2026-07-17T10:02:00.000Z") });

    await expect(autoCallNextTicketNearServiceEnd(prisma as never, "room-id", now)).resolves.toEqual({
      calledTicketId: "waiting-ticket",
      roomId: "room-id",
    });
    expect(prisma.updates).toHaveLength(1);
    expect(prisma.events).toHaveLength(1);
  });

  it("does not call early before the two minute threshold", async () => {
    const now = new Date("2026-07-17T10:00:00.000Z");
    const prisma = makePrisma({ expectedEndAt: new Date("2026-07-17T10:02:01.000Z") });

    await expect(autoCallNextTicketNearServiceEnd(prisma as never, "room-id", now)).resolves.toEqual({
      calledTicketId: null,
      roomId: "room-id",
    });
    expect(prisma.updates).toHaveLength(0);
    expect(prisma.events).toHaveLength(0);
  });

  it("does not call another waiting ticket when the room already has a called ticket", async () => {
    const now = new Date("2026-07-17T10:00:00.000Z");
    const prisma = makePrisma({
      expectedEndAt: new Date("2026-07-17T10:02:00.000Z"),
      existingCalled: true,
    });

    await expect(autoCallNextTicketNearServiceEnd(prisma as never, "room-id", now)).resolves.toEqual({
      calledTicketId: null,
      roomId: "room-id",
    });
    expect(prisma.updates).toHaveLength(0);
    expect(prisma.events).toHaveLength(0);
  });
});
