import { describe, expect, it } from "vitest";
import { addMinutes, formatRemainingTime, getRemainingMilliseconds } from "@/lib/queue/timer";

describe("queue timer helpers", () => {
  it("persists timer math from expectedEndAt", () => {
    const startedAt = new Date("2026-07-17T10:00:00.000Z");
    const expectedEndAt = addMinutes(startedAt, 15);

    expect(expectedEndAt.toISOString()).toBe("2026-07-17T10:15:00.000Z");
    expect(getRemainingMilliseconds(expectedEndAt, new Date("2026-07-17T10:10:00.000Z"))).toBe(300_000);
  });

  it("does not go below zero and reports expired time", () => {
    const remaining = getRemainingMilliseconds("2026-07-17T10:00:00.000Z", new Date("2026-07-17T10:01:00.000Z"));

    expect(remaining).toBe(0);
    expect(formatRemainingTime(remaining)).toBe("Đã hết thời gian");
  });

  it("formats active countdowns", () => {
    expect(formatRemainingTime(61_000)).toBe("1:01");
  });
});
