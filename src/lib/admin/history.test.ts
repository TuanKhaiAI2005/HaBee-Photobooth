import { describe, expect, it } from "vitest";
import { buildHistoryWhere, historySearchParamsSchema } from "@/lib/admin/history";

describe("history filters", () => {
  it("keeps filtering server-side by room, status, date, name and phone", () => {
    const filters = historySearchParamsSchema.parse({
      roomId: "11111111-1111-4111-8111-111111111111",
      status: "COMPLETED",
      from: "2026-07-17",
      to: "2026-07-18",
      customerName: "Lan",
      phone: "090 123",
      page: "2",
    });

    expect(buildHistoryWhere(filters)).toMatchObject({
      roomId: "11111111-1111-4111-8111-111111111111",
      status: "COMPLETED",
      customerName: { contains: "Lan", mode: "insensitive" },
      normalizedPhone: { contains: "090123" },
      createdAt: {
        gte: new Date("2026-07-16T17:00:00.000Z"),
        lt: new Date("2026-07-18T17:00:00.000Z"),
      },
    });
  });

  it("caps URL-controlled paging to a positive page with fixed server page size", () => {
    const filters = historySearchParamsSchema.parse({ page: "-20" });

    expect(filters.page).toBe(1);
  });
});
