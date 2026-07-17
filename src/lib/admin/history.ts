import { Prisma, type PrismaClient, type QueueTicketStatus } from "@prisma/client";
import { z } from "zod";
import { formatDurationMinutes, todayVietnamUtcRange, vietnamDateToUtcRange } from "@/lib/timezone";

const finalStatuses = ["COMPLETED", "CANCELLED", "NO_SHOW"] as const satisfies QueueTicketStatus[];
const allStatuses = ["WAITING", "CALLED", "IN_SERVICE", ...finalStatuses] as const;
const pageSize = 20;

export const historySearchParamsSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
  roomId: z.string().uuid().optional().catch(undefined),
  status: z.enum(allStatuses).optional().catch(undefined),
  customerName: z.string().trim().max(80).optional().catch(undefined),
  phone: z.string().trim().max(30).optional().catch(undefined),
});

export type HistoryFilters = z.infer<typeof historySearchParamsSchema>;

export type HistoryTicket = {
  id: string;
  roomId: string;
  roomName: string;
  roomColor: string;
  customerName: string;
  normalizedPhone: string;
  ticketCode: string;
  registeredAt: Date;
  calledAt: Date | null;
  serviceStartedAt: Date | null;
  completedAt: Date | null;
  status: QueueTicketStatus;
  duration: string;
};

export function buildHistoryWhere(filters: HistoryFilters): Prisma.QueueTicketWhereInput {
  const createdAt: Prisma.DateTimeFilter = {};
  const from = filters.from ? vietnamDateToUtcRange(filters.from, "start") : null;
  const to = filters.to ? vietnamDateToUtcRange(filters.to, "endExclusive") : null;

  if (from) {
    createdAt.gte = from;
  }

  if (to) {
    createdAt.lt = to;
  }

  return {
    ...(Object.keys(createdAt).length ? { createdAt } : {}),
    ...(filters.roomId ? { roomId: filters.roomId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.customerName ? { customerName: { contains: filters.customerName, mode: "insensitive" } } : {}),
    ...(filters.phone ? { normalizedPhone: { contains: filters.phone.replace(/\D/g, "") || filters.phone } } : {}),
  };
}

export async function listHistory(prisma: PrismaClient, rawFilters: unknown) {
  const filters = historySearchParamsSchema.parse(rawFilters);
  const where = buildHistoryWhere(filters);
  const page = filters.page;
  const skip = (page - 1) * pageSize;

  const [total, tickets, rooms] = await Promise.all([
    prisma.queueTicket.count({ where }),
    prisma.queueTicket.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { registeredAt: "desc" }],
      skip,
      take: pageSize,
      include: { room: { select: { id: true, name: true, color: true } } },
    }),
    prisma.room.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, name: true, color: true } }),
  ]);

  return {
    filters,
    rooms,
    page,
    pageSize,
    total,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    tickets: tickets.map((ticket): HistoryTicket => ({
      id: ticket.id,
      roomId: ticket.roomId,
      roomName: ticket.room.name,
      roomColor: ticket.room.color,
      customerName: ticket.customerName,
      normalizedPhone: ticket.normalizedPhone,
      ticketCode: ticket.ticketCode,
      registeredAt: ticket.registeredAt,
      calledAt: ticket.calledAt,
      serviceStartedAt: ticket.serviceStartedAt,
      completedAt: ticket.checkoutAt ?? ticket.cancelledAt,
      status: ticket.status,
      duration: formatDurationMinutes(ticket.serviceStartedAt, ticket.checkoutAt),
    })),
  };
}

export async function getRoomTodayHistory(prisma: PrismaClient, roomId: string) {
  const { startUtc, endExclusiveUtc } = todayVietnamUtcRange();
  const tickets = await prisma.queueTicket.findMany({
    where: {
      roomId,
      createdAt: { gte: startUtc, lt: endExclusiveUtc },
      status: { in: finalStatuses },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 10,
    select: {
      id: true,
      customerName: true,
      ticketCode: true,
      serviceStartedAt: true,
      checkoutAt: true,
      cancelledAt: true,
      status: true,
    },
  });

  return {
    completedCount: tickets.filter((ticket) => ticket.status === "COMPLETED").length,
    tickets: tickets.map((ticket) => ({
      ...ticket,
      completedAt: ticket.checkoutAt ?? ticket.cancelledAt,
      duration: formatDurationMinutes(ticket.serviceStartedAt, ticket.checkoutAt),
    })),
  };
}
