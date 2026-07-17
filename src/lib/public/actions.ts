"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createTicket } from "@/lib/public/tickets";
import { accessTokenSchema, createTicketSchema } from "@/lib/public/ticket-schemas";
import type { AdminActionState } from "@/lib/admin/action-state";
import { actionError, actionOk } from "@/lib/admin/action-state";
import { cancelTicketByToken, startServiceByAccessToken } from "@/lib/queue/operations";

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
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = accessTokenSchema.safeParse(formData.get("accessToken"));

  if (!parsed.success) {
    return actionError("Link vé không hợp lệ.");
  }

  try {
    await cancelTicketByToken(prisma, parsed.data);
    revalidatePath(`/ticket/${parsed.data}`);
    return actionOk();
  } catch {
    return actionError("Không thể hủy vé.");
  }
}

export async function confirmArrivedAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = accessTokenSchema.safeParse(formData.get("accessToken"));

  if (!parsed.success) {
    return actionError("Link vé không hợp lệ.");
  }

  try {
    await startServiceByAccessToken(prisma, parsed.data);
    revalidatePath(`/ticket/${parsed.data}`);
    return actionOk();
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Không thể xác nhận vào phòng.");
  }
}


