import { z } from "zod";

export const queueTicketActionSchema = z.object({
  ticketId: z.uuid(),
});

export const roomQueueActionSchema = z.object({
  roomId: z.uuid(),
});

export const reorderTicketSchema = z.object({
  ticketId: z.uuid(),
  direction: z.enum(["up", "down"]),
});

