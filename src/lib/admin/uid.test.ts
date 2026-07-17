import { describe, expect, it } from "vitest";
import { generateEmployeeUid, generateUniqueEmployeeUid } from "@/lib/admin/uid";

describe("employee UID generation", () => {
  it("generates NV-prefixed six digit identifiers", () => {
    expect(generateEmployeeUid(() => 0.123456)).toBe("NV-123456");
  });

  it("skips existing employee UIDs", async () => {
    const existing = new Set(["NV-100000"]);
    const repository = {
      async findUnique({ where }: { where: { employeeUid: string } }) {
        return existing.has(where.employeeUid) ? { id: "existing" } : null;
      },
    };
    const values = [0.1, 0.2];

    await expect(generateUniqueEmployeeUid(repository, () => values.shift() ?? 0.3)).resolves.toBe("NV-200000");
  });
});
