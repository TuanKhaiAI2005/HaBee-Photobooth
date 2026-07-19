import { Prisma, type QueueTicket } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { hashAccessToken } from "@/lib/security/token";
import { cancelTicketByToken } from "@/lib/queue/operations";
import { createTicket, getTicketByAccessToken, mapPublicQueueItem } from "@/lib/public/tickets";

function makeTicket(overrides: Partial<QueueTicket> = {}): QueueTicket {
  return {
    id: "ticket-id",
    ticketCode: "Q-260101-ABCDEF",
    roomId: "room-id",
    customerName: "Nguyen Van An",
    normalizedPhone: "+84912345678",
    customerAccessTokenHash: "hash",
    status: "WAITING",
    queuePosition: 1,
    registeredAt: new Date("2026-01-01T00:00:00.000Z"),
    calledAt: null,
    arrivalConfirmedAt: null,
    serviceStartedAt: null,
    expectedEndAt: null,
    checkoutAt: null,
    cancelledAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function makePrisma(overrides: Record<string, unknown> = {}) {
  const events: unknown[] = [];
  const createdTickets: unknown[] = [];
  const tx = {
    room: {
      async findUnique() {
        return {
          id: "room-id",
          name: "Phong 1",
          publicToken: "phong-1",
          color: "#111827",
          defaultDurationMinutes: 15,
          status: "ACTIVE",
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      },
    },
    queueTicket: {
      async findFirst(args?: { where?: { normalizedPhone?: string } }) {
        if (args?.where?.normalizedPhone === "+84000000000") {
          return { id: "active-ticket" };
        }
        return null;
      },
      async create({ data }: { data: unknown }) {
        createdTickets.push(data);
        return makeTicket(data as Partial<QueueTicket>);
      },
      async findUnique() {
        return null;
      },
      async count() {
        return 0;
      },
      async update() {
        return makeTicket({ status: "CANCELLED" });
      },
    },
    queueEvent: {
      async create({ data }: { data: unknown }) {
        events.push(data);
        return data;
      },
    },
    ...overrides,
  };

  return {
    events,
    createdTickets,
    async $transaction(callback: (transaction: typeof tx) => Promise<unknown>) {
      return callback(tx);
    },
    queueTicket: tx.queueTicket,
  };
}

describe("public ticket mapping", () => {
  it("does not expose full customer data to public queue", () => {
    const publicTicket = mapPublicQueueItem(makeTicket());

    expect(publicTicket.maskedName).toBe("**** **** An");
    expect(publicTicket.maskedPhone).toBe("********5678");
    expect(JSON.stringify(publicTicket)).not.toContain("Nguyen Van An");
    expect(JSON.stringify(publicTicket)).not.toContain("+84912345678");
  });
});

describe("ticket creation", () => {
  it("creates a ticket, queue position and queue event without storing the raw token", async () => {
    const prisma = makePrisma();
    const result = await createTicket(prisma as never, {
      publicToken: "phong-1",
      customerName: "Nguyen Van An",
      phone: "+84912345678",
    });

    expect(result.ticket.ticketCode).toMatch(/^Q-/);
    expect(result.ticket.queuePosition).toBe(1);
    expect(prisma.events).toHaveLength(1);
    expect(JSON.stringify(prisma.createdTickets)).not.toContain(result.accessToken);
    expect(JSON.stringify(prisma.createdTickets)).toContain(hashAccessToken(result.accessToken));
  });

  it("does not create tickets for paused rooms", async () => {
    const prisma = makePrisma({
      room: {
        async findUnique() {
          return { id: "room-id", status: "PAUSED" };
        },
      },
    });

    await expect(
      createTicket(prisma as never, {
        publicToken: "phong-1",
        customerName: "Nguyen Van An",
        phone: "+84912345678",
      }),
    ).rejects.toThrow("Phòng đang tạm dừng");
  });

  it("blocks one phone from having two active tickets", async () => {
    const prisma = makePrisma();

    await expect(
      createTicket(prisma as never, {
        publicToken: "phong-1",
        customerName: "Nguyen Van An",
        phone: "+84000000000",
      }),
    ).rejects.toThrow("Số điện thoại này đang có vé active.");
  });

  it("retries transaction conflicts so concurrent queue positions can recover", async () => {
    let attempts = 0;
    const prisma = makePrisma();
    const retryingPrisma = {
      ...prisma,
      async $transaction(callback: Parameters<typeof prisma.$transaction>[0]) {
        attempts += 1;
        if (attempts === 1) {
          throw new Prisma.PrismaClientKnownRequestError("Unique conflict", {
            code: "P2002",
            clientVersion: "test",
          });
        }
        return prisma.$transaction(callback);
      },
    };

    await expect(
      createTicket(retryingPrisma as never, {
        publicToken: "phong-1",
        customerName: "Nguyen Van An",
        phone: "+84912345678",
      }),
    ).resolves.toHaveProperty("ticket");
    expect(attempts).toBe(2);
  });
});

describe("ticket access and cancellation", () => {
  it("shows a ticket for a valid token and rejects a wrong token", async () => {
    const token = "valid-token";
    const tokenHash = hashAccessToken(token);
    const prisma = {
      queueTicket: {
        async findFirst({ where }: { where: { customerAccessTokenHash: string } }) {
          if (where.customerAccessTokenHash !== tokenHash) {
            return null;
          }
          return {
            ...makeTicket({ customerAccessTokenHash: tokenHash }),
            room: { name: "Phong 1", publicToken: "phong-1", defaultDurationMinutes: 15 },
          };
        },
        async count() {
          return 2;
        },
      },
    };

    await expect(getTicketByAccessToken(prisma as never, token)).resolves.toMatchObject({
      ticketCode: "Q-260101-ABCDEF",
      peopleAhead: 2,
      estimatedWaitingMinutes: 30,
    });
    await expect(getTicketByAccessToken(prisma as never, "wrong-token")).resolves.toBeNull();
  });

  it("cancels only by access token and creates one event", async () => {
    const token = "valid-token";
    const tokenHash = hashAccessToken(token);
    const events: unknown[] = [];
    const prisma = {
      async $transaction(callback: (tx: unknown) => Promise<unknown>) {
        return callback({
          queueTicket: {
            async findFirst({ where }: { where: { customerAccessTokenHash: string } }) {
              return where.customerAccessTokenHash === tokenHash
                ? { id: "ticket-a" }
                : null;
            },
            async findUnique() {
              return { id: "ticket-a", roomId: "room-id", status: "WAITING" };
            },
            async update({ where }: { where: { id: string } }) {
              expect(where.id).toBe("ticket-a");
              return makeTicket({ status: "CANCELLED" });
            },
          },
          queueEvent: {
            async create({ data }: { data: unknown }) {
              events.push(data);
              return data;
            },
          },
        });
      },
    };

    await expect(cancelTicketByToken(prisma as never, token)).resolves.toMatchObject({ status: "CANCELLED" });
    expect(events).toHaveLength(1);
    await expect(cancelTicketByToken(prisma as never, "wrong-token")).rejects.toThrow("Link vé không hợp lệ.");
  });

  it("does not cancel an already cancelled ticket as a new mutation", async () => {
    const prisma = {
      async $transaction(callback: (tx: unknown) => Promise<unknown>) {
        return callback({
          queueTicket: {
            async findFirst() {
              return { id: "ticket-a" };
            },
            async findUnique() {
              return { id: "ticket-a", roomId: "room-id", status: "CANCELLED" };
            },
          },
          queueEvent: {
            async create() {
              throw new Error("should not create event");
            },
          },
        });
      },
    };

    await expect(cancelTicketByToken(prisma as never, "valid-token")).rejects.toThrow("trạng thái");
  });
});
