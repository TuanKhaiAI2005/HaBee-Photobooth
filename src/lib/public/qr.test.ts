import { afterEach, describe, expect, it, vi } from "vitest";
import { getJoinPublicUrl, getRoomPublicUrl } from "@/lib/public/qr";

describe("QR public URLs", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the configured app base URL and public token", () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://example.test/";

    expect(getRoomPublicUrl("phong-1")).toBe("https://example.test/rooms/phong-1");
    expect(getJoinPublicUrl()).toBe("https://example.test/join");

    process.env.NEXT_PUBLIC_APP_URL = previous;
  });

  it("does not change when room name changes because it only uses public token", () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://example.test";

    const beforeRename = getRoomPublicUrl("stable-token");
    const afterRename = getRoomPublicUrl("stable-token");

    expect(afterRename).toBe(beforeRename);
    process.env.NEXT_PUBLIC_APP_URL = previous;
  });

  it("does not silently generate localhost QR URLs in production", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    vi.stubEnv("NODE_ENV", "production");

    expect(() => getJoinPublicUrl()).toThrow("localhost");
  });
});
