import { Prisma, PrismaClient, type QueueTicket, type Room } from "@prisma/client";
import { hashAccessToken, generateAccessToken } from "@/lib/security/token";
import { maskName, maskPhone } from "@/lib/masking";
import { canRegisterRoomStatus, isPublicRoomStatus } from "@/lib/public/room-access";
import { activeTicketStatuses, estimateWaitingMinutes } from "@/lib/public/waiting-time";
import { generateTicketCode } from "@/lib/public/ticket-code";
import type { CreateTicketInput } from "@/lib/public/ticket-schemas";

export type PublicQueueItem = {
  ticketCode: string;
  maskedName: string;
  maskedPhone: string;
  status: QueueTicket["status"];
  queuePosition: number;
};

export type PublicRoomSummary = {
  id: string;
  name: string;
  publicToken: string;
  color: string;
  status: Room["status"];
  defaultDurationMinutes: number;
  waitingCount: number;
  estimatedWaitingMinutes: number;
};

export type PublicTicketView = {
  id: string;
  ticketCode: string;
  roomId: string;
  roomName: string;
  roomPublicToken: string;
  status: QueueTicket["status"];
  calledAt: Date | null;
  arrivalConfirmedAt: Date | null;
  serviceStartedAt: Date | null;
  expectedEndAt: Date | null;
  serverNow: Date;
  peopleAhead: number;
  estimatedWaitingMinutes: number;
};

type PublicRoomWithTickets = Room & {
  queueTickets: Pick<QueueTicket, "status" | "queuePosition" | "ticketCode" | "customerName" | "normalizedPhone">[];
};

export function mapPublicQueueItem(
  ticket: Pick<QueueTicket, "ticketCode" | "customerName" | "normalizedPhone" | "status" | "queuePosition">,
): PublicQueueItem {
  return {
    ticketCode: ticket.ticketCode,
    maskedName: maskName(ticket.customerName),
    maskedPhone: maskPhone(ticket.normalizedPhone),
    status: ticket.status,
    queuePosition: ticket.queuePosition,
  };
}

export function mapPublicRoomSummary(room: PublicRoomWithTickets): PublicRoomSummary {
  const waitingCount = room.queueTickets.filter((ticket) => activeTicketStatuses.includes(ticket.status)).length;

  return {
    id: room.id,
    name: room.name,
    publicToken: room.publicToken,
    color: room.color,
    status: room.status,
    defaultDurationMinutes: room.defaultDurationMinutes,
    waitingCount,
    estimatedWaitingMinutes: estimateWaitingMinutes(waitingCount, room.defaultDurationMinutes),
  };
}

export async function listPublicRooms(prisma: Prisma.TransactionClient): Promise<PublicRoomSummary[]> {
  const rooms = await prisma.room.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      queueTickets: {
        where: { status: { in: activeTicketStatuses } },
        select: {
          ticketCode: true,
          customerName: true,
          normalizedPhone: true,
          status: true,
          queuePosition: true,
        },
      },
    },
  });

  return rooms.map(mapPublicRoomSummary);
}

export async function getPublicRoomDetail(prisma: Prisma.TransactionClient, publicToken: string) {
  const room = await prisma.room.findUnique({
    where: { publicToken },
    include: {
      queueTickets: {
        where: { status: { in: activeTicketStatuses } },
        orderBy: { queuePosition: "asc" },
        select: {
          ticketCode: true,
          customerName: true,
          normalizedPhone: true,
          status: true,
          queuePosition: true,
        },
      },
    },
  });

  if (!room || !isPublicRoomStatus(room.status)) {
    return null;
  }

  return {
    room: mapPublicRoomSummary(room),
    queue: room.queueTickets.map(mapPublicQueueItem),
    canRegister: canRegisterRoomStatus(room.status),
  };
}

type TransactionHost = PrismaClient | Prisma.TransactionClient;

export async function createTicket(prisma: PrismaClient, input: CreateTicketInput) {
  const accessToken = generateAccessToken();
  const accessTokenHash = hashAccessToken(accessToken);

  for (let transactionAttempt = 0; transactionAttempt < 5; transactionAttempt += 1) {
    try {
      const ticket = await prisma.$transaction(
        async (tx) => {
      const room = await tx.room.findUnique({ where: { publicToken: input.publicToken } });

      if (!room || !isPublicRoomStatus(room.status)) {
        throw new Error("Phòng không tồn tại.");
      }

      if (!canRegisterRoomStatus(room.status)) {
        throw new Error("Phòng đang tạm dừng, không thể đăng ký.");
      }

      const activeTicket = await tx.queueTicket.findFirst({
        where: {
          normalizedPhone: input.phone,
          status: { in: activeTicketStatuses },
        },
        select: { id: true },
      });

      if (activeTicket) {
        throw new Error("Số điện thoại này đang có vé active.");
      }

      const lastTicket = await tx.queueTicket.findFirst({
        where: { roomId: room.id },
        orderBy: { queuePosition: "desc" },
        select: { queuePosition: true },
      });
      const queuePosition = (lastTicket?.queuePosition ?? 0) + 1;

          const createdTicket = await tx.queueTicket.create({
            data: {
              ticketCode: generateTicketCode(),
              roomId: room.id,
              customerName: input.customerName,
              normalizedPhone: input.phone,
              customerAccessTokenHash: accessTokenHash,
              status: "WAITING",
              queuePosition,
            },
          });

          await tx.queueEvent.create({
            data: {
              roomId: room.id,
              ticketId: createdTicket.id,
              eventType: "CUSTOMER_REGISTERED",
            },
          });

          return createdTicket;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      return { accessToken, ticket };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2002" || error.code === "P2034") &&
        transactionAttempt < 4
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Không thể tạo vé sau nhiều lần thử.");
}

export async function getTicketByAccessToken(prisma: TransactionHost, accessToken: string): Promise<PublicTicketView | null> {
  const accessTokenHash = hashAccessToken(accessToken);
  const ticket = await prisma.queueTicket.findFirst({
    where: { customerAccessTokenHash: accessTokenHash },
    include: { room: true },
  });

  if (!ticket) {
    return null;
  }

  const peopleAhead = await prisma.queueTicket.count({
    where: {
      roomId: ticket.roomId,
      status: { in: activeTicketStatuses },
      queuePosition: { lt: ticket.queuePosition },
    },
  });

  return {
    id: ticket.id,
    ticketCode: ticket.ticketCode,
    roomId: ticket.roomId,
    roomName: ticket.room.name,
    roomPublicToken: ticket.room.publicToken,
    status: ticket.status,
    calledAt: ticket.calledAt,
    arrivalConfirmedAt: ticket.arrivalConfirmedAt,
    serviceStartedAt: ticket.serviceStartedAt,
    expectedEndAt: ticket.expectedEndAt,
    serverNow: new Date(),
    peopleAhead,
    estimatedWaitingMinutes: estimateWaitingMinutes(peopleAhead, ticket.room.defaultDurationMinutes),
  };
}



