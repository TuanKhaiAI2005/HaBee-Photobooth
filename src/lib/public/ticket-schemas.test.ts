import { describe, expect, it } from "vitest";
import { createTicketSchema } from "@/lib/public/ticket-schemas";

describe("createTicketSchema", () => {
  it("requires customer name and phone for direct ticket creation calls", () => {
    expect(
      createTicketSchema.safeParse({
        publicToken: "room-token",
        customerName: "",
        phone: "",
      }).success,
    ).toBe(false);
  });

  it("accepts numeric customer phones with 9 to 11 digits and normalizes them", () => {
    const parsed = createTicketSchema.parse({
      publicToken: "room-token",
      customerName: "  Nguyen   Van An  ",
      phone: "0912345678",
    });

    expect(parsed).toMatchObject({
      customerName: "Nguyen Van An",
      phone: "+84912345678",
    });
  });

  it("rejects non-numeric phones and invalid lengths", () => {
    expect(
      createTicketSchema.safeParse({
        publicToken: "room-token",
        customerName: "Nguyen Van An",
        phone: "0912 345 678",
      }).success,
    ).toBe(false);
    expect(
      createTicketSchema.safeParse({
        publicToken: "room-token",
        customerName: "Nguyen Van An",
        phone: "12345",
      }).success,
    ).toBe(false);
  });
});
