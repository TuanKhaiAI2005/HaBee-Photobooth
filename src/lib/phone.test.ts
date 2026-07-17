import { describe, expect, it } from "vitest";
import { normalizeVietnamPhone } from "@/lib/phone";

describe("normalizeVietnamPhone", () => {
  it("normalizes numbers starting with 0", () => {
    expect(normalizeVietnamPhone("0912345678")).toBe("+84912345678");
  });

  it("normalizes numbers starting with 84", () => {
    expect(normalizeVietnamPhone("84912345678")).toBe("+84912345678");
  });

  it("normalizes numbers starting with +84", () => {
    expect(normalizeVietnamPhone("+84912345678")).toBe("+84912345678");
  });

  it("allows spaces and dashes", () => {
    expect(normalizeVietnamPhone("0912 345-678")).toBe("+84912345678");
  });

  it("rejects invalid numbers", () => {
    expect(normalizeVietnamPhone("12345")).toBeNull();
    expect(normalizeVietnamPhone("hello")).toBeNull();
  });
});
