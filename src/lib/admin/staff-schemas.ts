import { z } from "zod";

export const createStaffSchema = z.object({
  fullName: z.string().trim().min(1, "Họ tên không được trống.").max(100),
  password: z.string().min(4).max(128),
});

export const resetStaffPasswordSchema = z.object({
  id: z.string().uuid(),
  password: z.string().min(4).max(128),
});

export const staffIdSchema = z.object({
  id: z.string().uuid(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type ResetStaffPasswordInput = z.infer<typeof resetStaffPasswordSchema>;


