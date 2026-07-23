"use server";

import { Prisma, type QueueTicketStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionError, actionOk, type AdminActionState } from "@/lib/admin/action-state";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { vietnamDateToUtcRange } from "@/lib/timezone";

const historyTicketIdSchema = z.object({
  id: z.string().uuid(),
});

const historyDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const deletableStatuses = ["COMPLETED", "CANCELLED", "NO_SHOW"] as const satisfies QueueTicketStatus[];

function revalidateHistoryPaths(): void {
  revalidatePath("/admin/history");
  revalidatePath("/admin");
}

async function deleteHistoryByWhere(where: Prisma.QueueTicketWhereInput): Promise<number> {
  const result = await prisma.$transaction(async (tx) => {
    await tx.queueEvent.deleteMany({
      where: {
        ticket: {
          is: where,
        },
      },
    });

    return tx.queueTicket.deleteMany({ where });
  });

  revalidateHistoryPaths();
  return result.count;
}

export async function deleteHistoryTicketAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = historyTicketIdSchema.safeParse({ id: formData.get("id") });

  if (!parsed.success) {
    return actionError("Lịch sử không hợp lệ.");
  }

  try {
    const ticket = await prisma.queueTicket.findUnique({
      where: { id: parsed.data.id },
      select: { id: true, roomId: true, status: true },
    });

    if (!ticket) {
      return actionError("Không tìm thấy lịch sử.");
    }

    if (!deletableStatuses.includes(ticket.status as (typeof deletableStatuses)[number])) {
      return actionError("Chỉ xóa được lịch sử của vé đã hoàn tất, đã hủy hoặc vắng mặt.");
    }

    await prisma.$transaction([
      prisma.queueEvent.deleteMany({ where: { ticketId: ticket.id } }),
      prisma.queueTicket.delete({ where: { id: ticket.id } }),
    ]);

    revalidateHistoryPaths();
    revalidatePath(`/admin/rooms/${ticket.roomId}`);
    revalidatePath(`/admin/rooms/${ticket.roomId}/queue`);
    return actionOk("Đã xóa lịch sử.");
  } catch {
    return actionError("Không thể xóa lịch sử.");
  }
}

export async function deleteAllHistoryAction(
  state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void state;
  void formData;
  await requireAdmin();

  try {
    const count = await deleteHistoryByWhere({
      status: { in: [...deletableStatuses] },
    });

    return actionOk(`Đã xóa ${count} dòng lịch sử.`);
  } catch {
    return actionError("Không thể xóa tất cả lịch sử.");
  }
}

export async function deleteHistoryByDateAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = historyDateSchema.safeParse({ date: formData.get("date") });

  if (!parsed.success) {
    return actionError("Ngày xóa lịch sử không hợp lệ.");
  }

  const start = vietnamDateToUtcRange(parsed.data.date, "start");
  const endExclusive = vietnamDateToUtcRange(parsed.data.date, "endExclusive");

  if (!start || !endExclusive) {
    return actionError("Ngày xóa lịch sử không hợp lệ.");
  }

  try {
    const count = await deleteHistoryByWhere({
      status: { in: [...deletableStatuses] },
      createdAt: { gte: start, lt: endExclusive },
    });

    return actionOk(`Đã xóa ${count} dòng lịch sử trong ngày ${parsed.data.date}.`);
  } catch {
    return actionError("Không thể xóa lịch sử theo ngày.");
  }
}
