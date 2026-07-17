"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { actionError, actionOk, type AdminActionState } from "@/lib/admin/action-state";
import { createRoomForAdmin, deleteRoomForAdmin, pauseRoomForAdmin, updateRoomForAdmin } from "@/lib/admin/rooms";
import { createRoomSchema, roomIdSchema, updateRoomSchema } from "@/lib/admin/room-schemas";

export async function createRoomAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const account = await requireAdmin();
  const parsed = createRoomSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
    defaultDurationMinutes: formData.get("defaultDurationMinutes"),
    sortOrder: formData.get("sortOrder"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message);
  }

  try {
    await createRoomForAdmin(account, prisma.room, parsed.data);
    revalidatePath("/admin/rooms");
    revalidatePath("/admin");
    return actionOk();
  } catch {
    return actionError("Không thể tạo phòng. Vui lòng kiểm tra public token hoặc dữ liệu nhập.");
  }
}

export async function updateRoomAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const account = await requireAdmin();
  const parsed = updateRoomSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    color: formData.get("color"),
    defaultDurationMinutes: formData.get("defaultDurationMinutes"),
    sortOrder: formData.get("sortOrder"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message);
  }

  try {
    await updateRoomForAdmin(account, prisma.room, parsed.data);
    revalidatePath("/admin/rooms");
    revalidatePath("/admin");
    return actionOk();
  } catch {
    return actionError("Không thể cập nhật phòng.");
  }
}

export async function pauseRoomAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const account = await requireAdmin();
  const parsed = roomIdSchema.safeParse({ id: formData.get("id") });

  if (!parsed.success) {
    return actionError("Phòng không hợp lệ.");
  }

  try {
    await pauseRoomForAdmin(account, prisma.room, parsed.data.id);
    revalidatePath("/admin/rooms");
    revalidatePath("/admin");
    return actionOk();
  } catch {
    return actionError("Không thể tạm dừng phòng.");
  }
}

export async function deleteRoomAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const account = await requireAdmin();
  const parsed = roomIdSchema.safeParse({ id: formData.get("id") });

  if (!parsed.success) {
    return actionError("Phòng không hợp lệ.");
  }

  try {
    const usage = await prisma.room.findUnique({
      where: { id: parsed.data.id },
      select: {
        _count: {
          select: {
            queueTickets: true,
            queueEvents: true,
          },
        },
      },
    });

    if (!usage) {
      return actionError("Phòng không tồn tại.");
    }

    if (usage._count.queueTickets > 0 || usage._count.queueEvents > 0) {
      return actionError("Phòng đã có dữ liệu hàng đợi/lịch sử nên không thể xóa thật. Hãy chuyển trạng thái sang Ngừng dùng để giữ lịch sử.");
    }

    await deleteRoomForAdmin(account, prisma.room, parsed.data.id);
    revalidatePath("/admin/rooms");
    revalidatePath("/admin");
    revalidatePath("/rooms");
    revalidatePath("/join");
    return actionOk("Đã xóa phòng.");
  } catch {
    return actionError("Không thể xóa phòng.");
  }
}


