import { z } from "zod";

export const roomStatusSchema = z.enum(["ACTIVE", "PAUSED", "MAINTENANCE", "INACTIVE"]);

export const createRoomSchema = z.object({
  name: z.string().trim().min(1, "Tên phòng không được trống.").max(80),
  color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/, "Màu phải là mã màu hex hợp lệ."),
  defaultDurationMinutes: z.coerce.number().int().min(5).max(240),
  sortOrder: z.coerce.number().int().min(0).max(999),
  status: roomStatusSchema.default("ACTIVE"),
});

export const updateRoomSchema = createRoomSchema.extend({
  id: z.string().uuid(),
});

export const roomIdSchema = z.object({
  id: z.string().uuid(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;


