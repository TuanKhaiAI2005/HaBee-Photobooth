import { describe, expect, it } from "vitest";
import { autoCallNextTicketNearServiceEnd, moveWaitingTicket } from "@/lib/queue/operations";

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

describe("moveWaitingTicket", () => {
  it("reorders queuePosition without changing the immutable daily queue number", async () => {
    const updates: Array<{ where: { id: string }; data: Record<string, unknown> }> = [];
    const tickets = new Map([
      ["ticket-10", { id: "ticket-10", roomId: "room-1", status: "WAITING", queuePosition: 10, queueNumber: 10 }],
      ["ticket-11", { id: "ticket-11", roomId: "room-1", status: "WAITING", queuePosition: 11, queueNumber: 11 }],
    ]);
    const tx = {
      queueTicket: {
        async findUnique({ where }: { where: { id: string } }) {
          return tickets.get(where.id) ?? null;
        },
        async findFirst() {
          return tickets.get("ticket-10") ?? null;
        },
        async update(args: { where: { id: string }; data: Record<string, unknown> }) {
          updates.push(args);
          const current = tickets.get(args.where.id);
          if (!current) throw new Error("missing fixture ticket");
          const updated = { ...current, ...args.data };
          tickets.set(args.where.id, updated as typeof current);
          return updated;
        },
      },
      queueEvent: {
        async create() {
          return null;
        },
      },
    };
    const prisma = {
      async $transaction(callback: (transaction: typeof tx) => Promise<unknown>) {
        return callback(tx);
      },
    };

    const moved = await moveWaitingTicket(prisma as never, "ticket-11", "up");

    expect(moved).toMatchObject({ queuePosition: 10, queueNumber: 11 });
    expect(updates).toHaveLength(3);
    expect(updates.every((update) => !("queueNumber" in update.data))).toBe(true);
  });
});
