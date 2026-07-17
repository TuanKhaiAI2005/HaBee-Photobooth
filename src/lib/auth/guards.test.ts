import { describe, expect, it } from "vitest";
import { assertRole, ForbiddenError } from "@/lib/auth/roles";
import type { PublicAccount } from "@/lib/auth/account";

const admin: PublicAccount = {
  id: "admin-id",
  fullName: "Admin",
  role: "ADMIN",
  isActive: true,
};

const staff: PublicAccount = {
  id: "staff-id",
  fullName: "Staff",
  role: "STAFF",
  isActive: true,
};

describe("role guards", () => {
  it("rejects missing accounts", () => {
    expect(() => assertRole(null, ["ADMIN"])).toThrow("Unauthorized");
  });

  it("rejects the wrong role", () => {
    expect(() => assertRole(staff, ["ADMIN"])).toThrow(ForbiddenError);
  });

  it("allows matching roles", () => {
    expect(assertRole(admin, ["ADMIN"])).toBe(admin);
    expect(assertRole(staff, ["ADMIN", "STAFF"])).toBe(staff);
  });
});
