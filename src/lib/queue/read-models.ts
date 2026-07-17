import type { Prisma, QueueTicket } from "@prisma/client";
import { maskName, maskPhone } from "@/lib/masking";
import { activeTicketStatuses, estimateWaitingMinutes } from "@/lib/public/waiting-time";

type QueueTicketListItem = Pick<
  QueueTicket,
  | "id"
  | "ticketCode"
  | "customerName"
  | "normalizedPhone"
  | "status"
  | "queuePosition"
  | "calledAt"
  | "serviceStartedAt"
  | "expectedEndAt"
  | "registeredAt"
>;

export type AdminQueueTicket = QueueTicketListItem;

export type StaffQueueTicket = Omit<QueueTicketListItem, "customerName" | "normalizedPhone"> & {
  maskedName: string;
  maskedPhone: string;
};

export type RoomQueueOperationView = {
  room: {
    id: string;
    name: string;
    color: string;
    status: string;
    defaultDurationMinutes: number;
  };
  serverNow: Date;
  inService: AdminQueueTicket | null;
  called: AdminQueueTicket | null;
  waiting: AdminQueueTicket[];
  waitingCount: number;
  estimatedWaitingMinutes: number;
};

export type StaffRoomQueueView = Omit<RoomQueueOperationView, "inService" | "called" | "waiting"> & {
  inService: StaffQueueTicket | null;
  called: StaffQueueTicket | null;
  waiting: StaffQueueTicket[];
};

function mapStaffTicket(ticket: AdminQueueTicket): StaffQueueTicket {
  const { customerName, normalizedPhone, ...safeTicket } = ticket;

  return {
    ...safeTicket,
    maskedName: maskName(customerName),
    maskedPhone: maskPhone(normalizedPhone),
  };
}

export async function getAdminRoomQueue(prisma: Prisma.TransactionClient, roomId: string): Promise<RoomQueueOperationView | null> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: {
      id: true,
      name: true,
      color: true,
      status: true,
      defaultDurationMinutes: true,
      queueTickets: {
        where: { status: { in: activeTicketStatuses } },
        orderBy: [{ queuePosition: "asc" }, { registeredAt: "asc" }],
        select: {
          id: true,
          ticketCode: true,
          customerName: true,
          normalizedPhone: true,
          status: true,
          queuePosition: true,
          calledAt: true,
          serviceStartedAt: true,
          expectedEndAt: true,
          registeredAt: true,
        },
      },
    },
  });

  if (!room) {
    return null;
  }

  const inService = room.queueTickets.find((ticket) => ticket.status === "IN_SERVICE") ?? null;
  const called = room.queueTickets.find((ticket) => ticket.status === "CALLED") ?? null;
  const waiting = room.queueTickets.filter((ticket) => ticket.status === "WAITING");

  return {
    room: {
      id: room.id,
      name: room.name,
      color: room.color,
      status: room.status,
      defaultDurationMinutes: room.defaultDurationMinutes,
    },
    serverNow: new Date(),
    inService,
    called,
    waiting,
    waitingCount: waiting.length,
    estimatedWaitingMinutes: estimateWaitingMinutes(waiting.length, room.defaultDurationMinutes),
  };
}

export async function getStaffRoomQueue(prisma: Prisma.TransactionClient, roomId: string): Promise<StaffRoomQueueView | null> {
  const view = await getAdminRoomQueue(prisma, roomId);

  if (!view) {
    return null;
  }

  return {
    ...view,
    inService: view.inService ? mapStaffTicket(view.inService) : null,
    called: view.called ? mapStaffTicket(view.called) : null,
    waiting: view.waiting.map(mapStaffTicket),
  };
}

export async function listStaffRooms(prisma: Prisma.TransactionClient) {
  const rooms = await prisma.room.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      color: true,
      status: true,
      defaultDurationMinutes: true,
      queueTickets: {
        where: { status: { in: activeTicketStatuses } },
        select: {
          id: true,
          status: true,
          expectedEndAt: true,
        },
      },
    },
  });

  const serverNow = new Date();

  return {
    serverNow,
    rooms: rooms.map((room) => ({
      id: room.id,
      name: room.name,
      color: room.color,
      status: room.status,
      defaultDurationMinutes: room.defaultDurationMinutes,
      waitingCount: room.queueTickets.filter((ticket) => ticket.status === "WAITING").length,
      hasCalled: room.queueTickets.some((ticket) => ticket.status === "CALLED"),
      inService: room.queueTickets.find((ticket) => ticket.status === "IN_SERVICE") ?? null,
    })),
  };
}
