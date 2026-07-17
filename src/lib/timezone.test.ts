import { describe, expect, it } from "vitest";
import { formatDurationMinutes, todayVietnamUtcRange, vietnamDateToUtcRange } from "@/lib/timezone";

describe("timezone helpers", () => {
  it("converts Vietnam calendar dates to UTC ranges", () => {
    expect(vietnamDateToUtcRange("2026-07-17", "start")?.toISOString()).toBe("2026-07-16T17:00:00.000Z");
    expect(vietnamDateToUtcRange("2026-07-17", "endExclusive")?.toISOString()).toBe("2026-07-17T17:00:00.000Z");
  });

  it("calculates today by Asia/Ho_Chi_Minh instead of UTC day", () => {
    const range = todayVietnamUtcRange(new Date("2026-07-16T18:00:00.000Z"));

    expect(range.startUtc.toISOString()).toBe("2026-07-16T17:00:00.000Z");
    expect(range.endExclusiveUtc.toISOString()).toBe("2026-07-17T17:00:00.000Z");
  });

  it("formats real service duration only when both timestamps exist", () => {
    expect(formatDurationMinutes(new Date("2026-07-17T00:00:00Z"), new Date("2026-07-17T01:12:00Z"))).toBe("1 giờ 12 phút");
    expect(formatDurationMinutes(null, new Date("2026-07-17T01:12:00Z"))).toBe("-");
  });
});
