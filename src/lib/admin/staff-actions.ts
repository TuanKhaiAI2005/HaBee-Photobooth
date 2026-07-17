"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { actionError, actionOk, type AdminActionState } from "@/lib/admin/action-state";
import {
  createStaffForAdmin,
  deleteStaffForAdmin,
  resetStaffPasswordForAdmin,
  setStaffActiveForAdmin,
} from "@/lib/admin/staff";
import {
  createStaffSchema,
  resetStaffPasswordSchema,
  staffIdSchema,
} from "@/lib/admin/staff-schemas";

export async function createStaffAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const account = await requireAdmin();
  const parsed = createStaffSchema.safeParse({
    fullName: formData.get("fullName"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message);
  }

  try {
    await createStaffForAdmin(account, prisma.account, parsed.data);
    revalidatePath("/admin/staff");
    revalidatePath("/admin");
    return actionOk();
  } catch {
    return actionError("Không thể tạo nhân viên.");
  }
}

export async function resetStaffPasswordAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const account = await requireAdmin();
  const parsed = resetStaffPasswordSchema.safeParse({
    id: formData.get("id"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message);
  }

  try {
    await resetStaffPasswordForAdmin(account, prisma.account, parsed.data);
    revalidatePath("/admin/staff");
    return actionOk();
  } catch {
    return actionError("Không thể reset PIN/password.");
  }
}

export async function setStaffActiveAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const account = await requireAdmin();
  const parsed = staffIdSchema.safeParse({ id: formData.get("id") });
  const isActive = formData.get("isActive") === "true";

  if (!parsed.success) {
    return actionError("Nhân viên không hợp lệ.");
  }

  try {
    await setStaffActiveForAdmin(account, prisma.account, parsed.data.id, isActive);
    revalidatePath("/admin/staff");
    revalidatePath("/admin");
    return actionOk();
  } catch {
    return actionError("Không thể cập nhật trạng thái nhân viên.");
  }
}

export async function deleteStaffAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const account = await requireAdmin();
  const parsed = staffIdSchema.safeParse({ id: formData.get("id") });

  if (!parsed.success) {
    return actionError("Nhân viên không hợp lệ.");
  }

  try {
    const target = await prisma.account.findUnique({
      where: { id: parsed.data.id },
      select: { role: true },
    });

    if (!target || target.role !== "STAFF") {
      return actionError("Chỉ được xóa tài khoản nhân viên.");
    }

    await deleteStaffForAdmin(account, prisma.account, parsed.data.id);
    revalidatePath("/admin/staff");
    revalidatePath("/admin");
    return actionOk("Đã xóa nhân viên.");
  } catch {
    return actionError("Không thể xóa nhân viên.");
  }
}



