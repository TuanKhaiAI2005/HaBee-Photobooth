import { describe, expect, it } from "vitest";
import { generateAccessToken, hashAccessToken } from "@/lib/security/token";

describe("access tokens", () => {
  it("generates strong URL-safe tokens", () => {
    const token = generateAccessToken();

    expect(token.length).toBeGreaterThanOrEqual(43);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("generates different tokens", () => {
    expect(generateAccessToken()).not.toBe(generateAccessToken());
  });

  it("hashes tokens deterministically", () => {
    expect(hashAccessToken("secret-token")).toBe(hashAccessToken("secret-token"));
    expect(hashAccessToken("secret-token")).toHaveLength(64);
  });
});
