import { describe, expect, it } from "vitest";
import { maskPhone } from "./masking";

describe("maskPhone", () => {
  it("keeps only a minimal visible prefix and suffix", () => {
    expect(maskPhone("0912 345 678")).toBe("091*****78");
  });

  it("masks short phone-like values completely", () => {
    expect(maskPhone("1234")).toBe("****");
  });
});
