import { z } from "zod";

export const adminLoginSchema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(8).max(128),
});

export const staffLoginSchema = z.object({
  employeeUid: z.string().trim().toUpperCase().min(1).max(64),
  password: z.string().min(4).max(128),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type StaffLoginInput = z.infer<typeof staffLoginSchema>;
