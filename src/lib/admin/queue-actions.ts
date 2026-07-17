"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { actionError, actionOk, type AdminActionState } from "@/lib/admin/action-state";
import { queueTicketActionSchema, reorderTicketSchema, roomQueueActionSchema } from "@/lib/admin/queue-schemas";
import { callNextTicket, cancelTicket, checkoutTicket, markTicketNoShow, moveWaitingTicket, startServiceForTicket } from "@/lib/queue/operations";

function revalidateQueuePaths(roomId?: string): void {
  revalidatePath("/admin");
  revalidatePath("/staff");

  if (roomId) {
    revalidatePath(`/admin/rooms/${roomId}/queue`);
    revalidatePath(`/staff/rooms/${roomId}`);
  }
}

export async function callNextTicketAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = roomQueueActionSchema.safeParse({ roomId: formData.get("roomId") });

  if (!parsed.success) {
    return actionError("Phòng không hợp lệ.");
  }

  try {
    await callNextTicket(prisma, parsed.data.roomId);
    revalidateQueuePaths(parsed.data.roomId);
    return actionOk();
  } catch (error) {
    return actionError(error instanceof Error ? error.message : undefined);
  }
}

export async function startServiceAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = queueTicketActionSchema.safeParse({ ticketId: formData.get("ticketId") });

  if (!parsed.success) {
    return actionError("Vé không hợp lệ.");
  }

  try {
    const ticket = await startServiceForTicket(prisma, parsed.data.ticketId);
    revalidateQueuePaths(ticket.roomId);
    return actionOk();
  } catch (error) {
    return actionError(error instanceof Error ? error.message : undefined);
  }
}

export async function checkoutTicketAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = queueTicketActionSchema.safeParse({ ticketId: formData.get("ticketId") });

  if (!parsed.success) {
    return actionError("Vé không hợp lệ.");
  }

  try {
    const result = await checkoutTicket(prisma, parsed.data.ticketId);
    revalidateQueuePaths(result.ticket.roomId);
    return actionOk(
      result.autoCalledTicketId
        ? "Đã hoàn tất lượt và tự động gọi vé tiếp theo."
        : "Đã hoàn tất lượt.",
    );
  } catch (error) {
    return actionError(error instanceof Error ? error.message : undefined);
  }
}

export async function cancelTicketAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = queueTicketActionSchema.safeParse({ ticketId: formData.get("ticketId") });

  if (!parsed.success) {
    return actionError("Vé không hợp lệ.");
  }

  try {
    const ticket = await cancelTicket(prisma, parsed.data.ticketId, "ADMIN");
    revalidateQueuePaths(ticket.roomId);
    return actionOk();
  } catch (error) {
    return actionError(error instanceof Error ? error.message : undefined);
  }
}

export async function noShowTicketAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = queueTicketActionSchema.safeParse({ ticketId: formData.get("ticketId") });

  if (!parsed.success) {
    return actionError("Vé không hợp lệ.");
  }

  try {
    const ticket = await markTicketNoShow(prisma, parsed.data.ticketId);
    revalidateQueuePaths(ticket.roomId);
    return actionOk();
  } catch (error) {
    return actionError(error instanceof Error ? error.message : undefined);
  }
}

export async function reorderWaitingTicketAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = reorderTicketSchema.safeParse({
    ticketId: formData.get("ticketId"),
    direction: formData.get("direction"),
  });

  if (!parsed.success) {
    return actionError("Yêu cầu sắp xếp không hợp lệ.");
  }

  try {
    const ticket = await moveWaitingTicket(prisma, parsed.data.ticketId, parsed.data.direction);
    revalidateQueuePaths(ticket.roomId);
    return actionOk();
  } catch (error) {
    return actionError(error instanceof Error ? error.message : undefined);
  }
}


