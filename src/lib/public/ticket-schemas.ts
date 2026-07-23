import { z } from "zod";
import { normalizeVietnamPhone } from "@/lib/phone";

export const createTicketSchema = z.object({
  publicToken: z.string().trim().min(1).max(120),
  customerName: z.string().trim().min(1).max(100).transform((value) => value.replace(/\s+/g, " ")),
  phone: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập số điện thoại.")
    .regex(/^\d+$/, "Số điện thoại chỉ được gồm chữ số.")
    .min(9, "Số điện thoại phải có 9-11 chữ số.")
    .max(11, "Số điện thoại phải có 9-11 chữ số.")
    .transform((value, context) => {
      const normalized = normalizeVietnamPhone(value);

      if (!normalized) {
        context.addIssue({
          code: "custom",
          message: "Số điện thoại không hợp lệ.",
        });
        return z.NEVER;
      }

      return normalized;
    }),
});

export const accessTokenSchema = z.string().min(32).max(128).regex(/^[A-Za-z0-9_-]+$/);

export type CreateTicketInput = z.infer<typeof createTicketSchema>;


