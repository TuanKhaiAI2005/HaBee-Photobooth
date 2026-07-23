"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createTicket } from "@/lib/public/tickets";
import { createTicketSchema } from "@/lib/public/ticket-schemas";
import type { AdminActionState } from "@/lib/admin/action-state";
import { actionError } from "@/lib/admin/action-state";

export async function createTicketAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = createTicketSchema.safeParse({
    publicToken: formData.get("publicToken"),
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message);
  }

  let accessToken: string;

  try {
    const result = await createTicket(prisma, parsed.data);
    accessToken = result.accessToken;
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Không thể đăng ký vé.");
  }

  revalidatePath("/rooms");
  revalidatePath(`/rooms/${parsed.data.publicToken}`);
  redirect(`/ticket/${accessToken}`);
}

export async function cancelTicketAction(
  _state: AdminActionState,
  _formData: FormData,
): Promise<AdminActionState> {
  void _state;
  void _formData;
  return actionError("Khách không thể hủy vé. Vui lòng liên hệ nhân viên nếu cần hỗ trợ.");
}

export async function confirmArrivedAction(
  _state: AdminActionState,
  _formData: FormData,
): Promise<AdminActionState> {
  void _state;
  void _formData;
  return actionError("Khách không cần xác nhận vào phòng. Nhân viên sẽ thao tác khi đến lượt.");
}


