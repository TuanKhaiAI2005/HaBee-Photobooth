import { z } from "zod";
import { normalizeVietnamPhone } from "@/lib/phone";

export const createTicketSchema = z.object({
  publicToken: z.string().trim().min(1).max(120),
  customerName: z.string().trim().min(1).max(100).transform((value) => value.replace(/\s+/g, " ")),
  phone: z
    .string()
    .trim()
    .min(8)
    .max(24)
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


