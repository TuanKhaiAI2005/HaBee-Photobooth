import { Prisma, type PrismaClient, type QueueTicketStatus } from "@prisma/client";
import { hashAccessToken } from "@/lib/security/token";
import { assertTicketTransition } from "@/lib/queue/transitions";
import { addMinutes } from "@/lib/queue/timer";

type TransactionHost = PrismaClient | Prisma.TransactionClient;

export type ActorType = "ADMIN" | "CUSTOMER";

const roomOperationalStatuses = ["ACTIVE", "PAUSED"] as const;
const preCallThresholdMs = 2 * 60 * 1000;

function isRetryable(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2002" || error.code === "P2034");
}

async function withSerializableRetry<T>(prisma: PrismaClient, run: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await prisma.$transaction(run, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (isRetryable(error) && attempt < 4) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Không thể cập nhật hàng đợi sau nhiều lần thử.");
}

async function createEvent(
  tx: Prisma.TransactionClient,
  roomId: string,
  ticketId: string | null,
  eventType: string,
): Promise<void> {
  await tx.queueEvent.create({ data: { roomId, ticketId, eventType } });
}

async function ensureRoomCanOperate(tx: Prisma.TransactionClient, roomId: string) {
  const room = await tx.room.findUnique({ where: { id: roomId } });

  if (!room) {
    throw new Error("Phòng không tồn tại.");
  }

  if (!roomOperationalStatuses.includes(room.status as (typeof roomOperationalStatuses)[number])) {
    throw new Error("Phòng hiện không thể vận hành hàng đợi.");
  }

  return room;
}

export async function callNextTicket(prisma: PrismaClient, roomId: string) {
  return withSerializableRetry(prisma, async (tx) => {
    await ensureRoomCanOperate(tx, roomId);

    const existingCalled = await tx.queueTicket.findFirst({
      where: { roomId, status: "CALLED" },
      select: { id: true },
    });

    if (existingCalled) {
      throw new Error("Phòng đang có khách đã được gọi.");
    }

    const ticket = await tx.queueTicket.findFirst({
      where: { roomId, status: "WAITING" },
      orderBy: [{ queuePosition: "asc" }, { registeredAt: "asc" }],
    });

    if (!ticket) {
      throw new Error("Không có vé đang chờ.");
    }

    assertTicketTransition(ticket.status, "CALLED");
    const calledAt = new Date();
    const updated = await tx.queueTicket.update({
      where: { id: ticket.id, status: "WAITING" },
      data: { status: "CALLED", calledAt },
    });

    await createEvent(tx, roomId, updated.id, "TICKET_CALLED");
    return updated;
  });
}

export async function autoCallNextTicketNearServiceEnd(
  prisma: PrismaClient,
  roomId: string,
  now = new Date(),
) {
  return withSerializableRetry(prisma, async (tx) => {
    await ensureRoomCanOperate(tx, roomId);

    const inService = await tx.queueTicket.findFirst({
      where: {
        roomId,
        status: "IN_SERVICE",
        expectedEndAt: { not: null },
      },
      select: {
        id: true,
        expectedEndAt: true,
      },
    });

    if (!inService?.expectedEndAt) {
      return { calledTicketId: null, roomId };
    }

    const remainingMs = inService.expectedEndAt.getTime() - now.getTime();
    if (remainingMs > preCallThresholdMs) {
      return { calledTicketId: null, roomId };
    }

    const existingCalled = await tx.queueTicket.findFirst({
      where: { roomId, status: "CALLED" },
      select: { id: true },
    });

    if (existingCalled) {
      return { calledTicketId: null, roomId };
    }

    const next = await tx.queueTicket.findFirst({
      where: { roomId, status: "WAITING" },
      orderBy: [{ queuePosition: "asc" }, { registeredAt: "asc" }],
    });

    if (!next) {
      return { calledTicketId: null, roomId };
    }

    assertTicketTransition(next.status, "CALLED");
    const called = await tx.queueTicket.update({
      where: { id: next.id, status: "WAITING" },
      data: { status: "CALLED", calledAt: now },
    });

    await createEvent(tx, roomId, called.id, "TICKET_AUTO_CALLED");
    return { calledTicketId: called.id, roomId };
  });
}

export async function startServiceForTicket(prisma: PrismaClient, ticketId: string) {
  return withSerializableRetry(prisma, async (tx) => {
    const ticket = await tx.queueTicket.findUnique({ where: { id: ticketId }, include: { room: true } });

    if (!ticket) {
      throw new Error("Vé không tồn tại.");
    }

    assertTicketTransition(ticket.status, "IN_SERVICE");

    const existingInService = await tx.queueTicket.findFirst({
      where: { roomId: ticket.roomId, status: "IN_SERVICE" },
      select: { id: true },
    });

    if (existingInService) {
      throw new Error("Phòng đang có khách sử dụng.");
    }

    const serviceStartedAt = new Date();
    const expectedEndAt = addMinutes(serviceStartedAt, ticket.room.defaultDurationMinutes);
    const updated = await tx.queueTicket.update({
      where: { id: ticket.id, status: "CALLED" },
      data: { status: "IN_SERVICE", serviceStartedAt, expectedEndAt },
    });

    await createEvent(tx, ticket.roomId, updated.id, "SERVICE_STARTED");
    return updated;
  });
}

export async function startServiceByAccessToken(prisma: PrismaClient, accessToken: string) {
  const accessTokenHash = hashAccessToken(accessToken);

  return withSerializableRetry(prisma, async (tx) => {
    const ticket = await tx.queueTicket.findFirst({
      where: { customerAccessTokenHash: accessTokenHash },
      select: { id: true },
    });

    if (!ticket) {
      throw new Error("Link vé không hợp lệ.");
    }

    return startServiceInsideTransaction(tx, ticket.id);
  });
}

export async function confirmArrivalByAccessToken(prisma: PrismaClient, accessToken: string) {
  const accessTokenHash = hashAccessToken(accessToken);

  return withSerializableRetry(prisma, async (tx) => {
    const ticket = await tx.queueTicket.findFirst({
      where: { customerAccessTokenHash: accessTokenHash },
    });

    if (!ticket) {
      throw new Error("Link vé không hợp lệ.");
    }

    if (ticket.status !== "CALLED") {
      throw new Error("Chỉ có thể xác nhận khi vé đã được gọi.");
    }

    const updated = await tx.queueTicket.update({
      where: { id: ticket.id, status: "CALLED" },
      data: { arrivalConfirmedAt: new Date() },
    });

    await createEvent(tx, ticket.roomId, updated.id, "CUSTOMER_CONFIRMED_ARRIVAL");
    return updated;
  });
}

async function startServiceInsideTransaction(tx: Prisma.TransactionClient, ticketId: string) {
  const ticket = await tx.queueTicket.findUnique({ where: { id: ticketId }, include: { room: true } });

  if (!ticket) {
    throw new Error("Vé không tồn tại.");
  }

  assertTicketTransition(ticket.status, "IN_SERVICE");

  const existingInService = await tx.queueTicket.findFirst({
    where: { roomId: ticket.roomId, status: "IN_SERVICE" },
    select: { id: true },
  });

  if (existingInService) {
    throw new Error("Phòng đang có khách sử dụng.");
  }

  const serviceStartedAt = new Date();
  const expectedEndAt = addMinutes(serviceStartedAt, ticket.room.defaultDurationMinutes);
  const updated = await tx.queueTicket.update({
    where: { id: ticket.id, status: "CALLED" },
    data: { status: "IN_SERVICE", serviceStartedAt, expectedEndAt },
  });

  await createEvent(tx, ticket.roomId, updated.id, "SERVICE_STARTED");
  return updated;
}

export async function checkoutTicket(prisma: PrismaClient, ticketId: string) {
  return withSerializableRetry(prisma, async (tx) => {
    const ticket = await tx.queueTicket.findUnique({ where: { id: ticketId } });

    if (!ticket) {
      throw new Error("Vé không tồn tại.");
    }

    assertTicketTransition(ticket.status, "COMPLETED");
    const checkoutAt = new Date();
    const updated = await tx.queueTicket.update({
      where: { id: ticket.id, status: "IN_SERVICE" },
      data: { status: "COMPLETED", checkoutAt },
    });

    await createEvent(tx, ticket.roomId, updated.id, "TICKET_COMPLETED");

    const existingCalled = await tx.queueTicket.findFirst({
      where: { roomId: ticket.roomId, status: "CALLED" },
      select: { id: true },
    });

    let autoCalledTicketId: string | null = null;

    if (!existingCalled) {
      const next = await tx.queueTicket.findFirst({
        where: { roomId: ticket.roomId, status: "WAITING" },
        orderBy: [{ queuePosition: "asc" }, { registeredAt: "asc" }],
      });

      if (next) {
        assertTicketTransition(next.status, "CALLED");
        const calledAt = new Date();
        const called = await tx.queueTicket.update({
          where: { id: next.id, status: "WAITING" },
          data: { status: "CALLED", calledAt },
        });
        await createEvent(tx, ticket.roomId, called.id, "TICKET_AUTO_CALLED");
        autoCalledTicketId = called.id;
      }
    }

    return { ticket: updated, autoCalledTicketId };
  });
}

export async function cancelTicket(prisma: PrismaClient, ticketId: string, actorType: ActorType) {
  return withSerializableRetry(prisma, async (tx) => {
    const ticket = await tx.queueTicket.findUnique({ where: { id: ticketId } });

    if (!ticket) {
      throw new Error("Vé không tồn tại.");
    }

    assertTicketTransition(ticket.status, "CANCELLED");
    const updated = await tx.queueTicket.update({
      where: { id: ticket.id, status: ticket.status },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    await createEvent(tx, ticket.roomId, updated.id, actorType === "ADMIN" ? "ADMIN_CANCELLED" : "CUSTOMER_CANCELLED");
    return updated;
  });
}

export async function cancelTicketByToken(prisma: PrismaClient, accessToken: string) {
  const accessTokenHash = hashAccessToken(accessToken);

  return withSerializableRetry(prisma, async (tx) => {
    const ticket = await tx.queueTicket.findFirst({
      where: { customerAccessTokenHash: accessTokenHash },
      select: { id: true },
    });

    if (!ticket) {
      throw new Error("Link vé không hợp lệ.");
    }

    const fullTicket = await tx.queueTicket.findUnique({ where: { id: ticket.id } });

    if (!fullTicket) {
      throw new Error("Vé không tồn tại.");
    }

    assertTicketTransition(fullTicket.status, "CANCELLED");
    const updated = await tx.queueTicket.update({
      where: { id: fullTicket.id, status: fullTicket.status },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    await createEvent(tx, fullTicket.roomId, updated.id, "CUSTOMER_CANCELLED");
    return updated;
  });
}

export async function markTicketNoShow(prisma: PrismaClient, ticketId: string) {
  return withSerializableRetry(prisma, async (tx) => {
    const ticket = await tx.queueTicket.findUnique({ where: { id: ticketId } });

    if (!ticket) {
      throw new Error("Vé không tồn tại.");
    }

    assertTicketTransition(ticket.status, "NO_SHOW");
    const updated = await tx.queueTicket.update({
      where: { id: ticket.id, status: "CALLED" },
      data: { status: "NO_SHOW" },
    });

    await createEvent(tx, ticket.roomId, updated.id, "TICKET_NO_SHOW");
    return updated;
  });
}

export async function moveWaitingTicket(prisma: PrismaClient, ticketId: string, direction: "up" | "down") {
  return withSerializableRetry(prisma, async (tx) => {
    const ticket = await tx.queueTicket.findUnique({ where: { id: ticketId } });

    if (!ticket || ticket.status !== "WAITING") {
      throw new Error("Chi co the sắp xếp vé đang chờ.");
    }

    const sibling = await tx.queueTicket.findFirst({
      where: {
        roomId: ticket.roomId,
        status: "WAITING",
        queuePosition: direction === "up" ? { lt: ticket.queuePosition } : { gt: ticket.queuePosition },
      },
      orderBy: { queuePosition: direction === "up" ? "desc" : "asc" },
    });

    if (!sibling) {
      return ticket;
    }

    const temporaryPosition = -Math.abs(ticket.queuePosition) - 1;
    await tx.queueTicket.update({ where: { id: ticket.id }, data: { queuePosition: temporaryPosition } });
    await tx.queueTicket.update({ where: { id: sibling.id }, data: { queuePosition: ticket.queuePosition } });
    const updated = await tx.queueTicket.update({ where: { id: ticket.id }, data: { queuePosition: sibling.queuePosition } });

    await createEvent(tx, ticket.roomId, null, "QUEUE_REORDERED");
    return updated;
  });
}

export async function countPeopleAhead(prisma: TransactionHost, roomId: string, queuePosition: number): Promise<number> {
  return prisma.queueTicket.count({
    where: {
      roomId,
      status: { in: ["WAITING", "CALLED", "IN_SERVICE"] satisfies QueueTicketStatus[] },
      queuePosition: { lt: queuePosition },
    },
  });
}



