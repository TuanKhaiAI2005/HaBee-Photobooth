import { describe, expect, it } from "vitest";
import { maskName, maskPhone } from "./masking";

describe("maskName", () => {
  it("masks two-word names", () => {
    expect(maskName("Le Nha")).toBe("**** Nha");
  });

  it("masks three-word names", () => {
    expect(maskName("Nguyen Van An")).toBe("**** **** An");
  });

  it("keeps one-word names", () => {
    expect(maskName("An")).toBe("An");
  });

  it("normalizes repeated spaces", () => {
    expect(maskName("  Nguyen   Van   An  ")).toBe("**** **** An");
  });
});

describe("maskPhone", () => {
  it("keeps only the final four digits", () => {
    expect(maskPhone("0912 345 678")).toBe("******5678");
  });

  it("masks short phone-like values completely", () => {
    expect(maskPhone("1234")).toBe("****");
  });
});
