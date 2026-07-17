import type { Account } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  authenticateAccount,
  toPublicAccount,
  validateAccountIdentifier,
  type AccountRepository,
} from "@/lib/auth/account";
import { hashPassword } from "@/lib/password";

function makeAccount(overrides: Partial<Account>): Account {
  return {
    id: "8f0877da-97a1-409a-9bfb-215e214bcc55",
    username: null,
    employeeUid: null,
    fullName: "Test Account",
    passwordHash: "hash",
    role: "ADMIN",
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function makeRepository(account: Account | null): AccountRepository & { updated: boolean } {
  return {
    updated: false,
    async findUnique() {
      return account;
    },
    async update() {
      this.updated = true;
      return account ?? makeAccount({});
    },
  };
}

describe("authenticateAccount", () => {
  it("allows admin login with username", async () => {
    const passwordHash = await hashPassword("admin-password");
    const repository = makeRepository(makeAccount({ username: "admin", passwordHash, role: "ADMIN" }));

    const account = await authenticateAccount(repository, "admin", "admin", "admin-password");

    expect(account?.role).toBe("ADMIN");
    expect(repository.updated).toBe(true);
  });

  it("allows staff login with employee UID", async () => {
    const passwordHash = await hashPassword("1234");
    const repository = makeRepository(makeAccount({ employeeUid: "S001", passwordHash, role: "STAFF" }));

    const account = await authenticateAccount(repository, "staff", "S001", "1234");

    expect(account?.role).toBe("STAFF");
    expect(repository.updated).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const passwordHash = await hashPassword("admin-password");
    const repository = makeRepository(makeAccount({ username: "admin", passwordHash, role: "ADMIN" }));

    await expect(authenticateAccount(repository, "admin", "admin", "wrong-password")).resolves.toBeNull();
    expect(repository.updated).toBe(false);
  });

  it("rejects inactive accounts", async () => {
    const passwordHash = await hashPassword("admin-password");
    const repository = makeRepository(makeAccount({ username: "admin", passwordHash, role: "ADMIN", isActive: false }));

    await expect(authenticateAccount(repository, "admin", "admin", "admin-password")).resolves.toBeNull();
    expect(repository.updated).toBe(false);
  });

  it("rejects admin identifiers in staff login", async () => {
    const passwordHash = await hashPassword("admin-password");
    const repository = makeRepository(makeAccount({ username: "admin", passwordHash, role: "ADMIN" }));

    await expect(authenticateAccount(repository, "staff", "admin", "admin-password")).resolves.toBeNull();
  });

  it("rejects staff identifiers in admin login", async () => {
    const passwordHash = await hashPassword("1234");
    const repository = makeRepository(makeAccount({ employeeUid: "S001", passwordHash, role: "STAFF" }));

    await expect(authenticateAccount(repository, "admin", "S001", "1234")).resolves.toBeNull();
  });

  it("validates identifiers by role", () => {
    expect(validateAccountIdentifier(makeAccount({ username: "admin", role: "ADMIN" }))).toBe(true);
    expect(validateAccountIdentifier(makeAccount({ employeeUid: "S001", role: "STAFF" }))).toBe(true);
    expect(validateAccountIdentifier(makeAccount({ username: "admin", employeeUid: "S001", role: "ADMIN" }))).toBe(false);
  });

  it("does not expose password hash in public account objects", () => {
    const publicAccount = toPublicAccount(makeAccount({ username: "admin", passwordHash: "secret-hash" }));

    expect(publicAccount).toEqual({
      id: "8f0877da-97a1-409a-9bfb-215e214bcc55",
      fullName: "Test Account",
      role: "ADMIN",
      isActive: true,
    });
    expect("passwordHash" in publicAccount).toBe(false);
  });
});
