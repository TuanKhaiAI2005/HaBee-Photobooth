import type { Account } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { ForbiddenError } from "@/lib/auth/roles";
import type { PublicAccount } from "@/lib/auth/account";
import { createStaffForAdmin, deleteStaffForAdmin } from "@/lib/admin/staff";

const admin: PublicAccount = {
  id: "admin",
  fullName: "Admin",
  role: "ADMIN",
  isActive: true,
};

const staffAccount: PublicAccount = {
  id: "staff",
  fullName: "Staff",
  role: "STAFF",
  isActive: true,
};

const createdStaff: Account = {
  id: "bd22d5f3-a01c-4a19-b2ab-f5b99c5be3d5",
  username: null,
  employeeUid: "NV-123456",
  fullName: "Nhan vien",
  passwordHash: "hash",
  role: "STAFF",
  isActive: true,
  lastLoginAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("staff admin mutations", () => {
  it("allows only admin to create staff", async () => {
    const repository = {
      async findUnique() {
        return null;
      },
      async create() {
        return createdStaff;
      },
      async update() {
        return createdStaff;
      },
    };

    await expect(
      createStaffForAdmin(admin, repository, {
        fullName: "Nhan vien",
        password: "1234",
      }),
    ).resolves.toEqual(createdStaff);

    await expect(
      createStaffForAdmin(staffAccount, repository, {
        fullName: "Nhan vien",
        password: "1234",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("allows only admin to delete staff", async () => {
    const repository = {
      async delete() {
        return createdStaff;
      },
    };

    await expect(deleteStaffForAdmin(admin, repository, createdStaff.id)).resolves.toEqual(createdStaff);
    await expect(deleteStaffForAdmin(staffAccount, repository, createdStaff.id)).rejects.toThrow(ForbiddenError);
  });
});
