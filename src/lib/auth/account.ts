import type { Account, AccountRole } from "@prisma/client";
import { verifyPassword } from "@/lib/password";

export type AccountRepository = {
  findUnique(args: {
    where: { username: string } | { employeeUid: string } | { id: string };
  }): Promise<Account | null>;
  update(args: { where: { id: string }; data: { lastLoginAt: Date } }): Promise<Account>;
};

export type PublicAccount = {
  id: string;
  fullName: string;
  role: AccountRole;
  isActive: boolean;
};

export type AuthenticatedAccount = PublicAccount & {
  username: string | null;
  employeeUid: string | null;
};

export type LoginKind = "admin" | "staff";

export const publicAccountSelect = {
  id: true,
  fullName: true,
  role: true,
  isActive: true,
} as const;

export function toPublicAccount(account: Account): PublicAccount {
  return {
    id: account.id,
    fullName: account.fullName,
    role: account.role,
    isActive: account.isActive,
  };
}

export function validateAccountIdentifier(account: Pick<Account, "role" | "username" | "employeeUid">): boolean {
  if (account.role === "ADMIN") {
    return account.username !== null && account.employeeUid === null;
  }

  return account.employeeUid !== null && account.username === null;
}

export async function authenticateAccount(
  repository: AccountRepository,
  kind: LoginKind,
  identifier: string,
  password: string,
): Promise<AuthenticatedAccount | null> {
  const account =
    kind === "admin"
      ? await repository.findUnique({ where: { username: identifier } })
      : await repository.findUnique({ where: { employeeUid: identifier } });

  const expectedRole: AccountRole = kind === "admin" ? "ADMIN" : "STAFF";

  if (!account || account.role !== expectedRole || !account.isActive || !validateAccountIdentifier(account)) {
    return null;
  }

  const isPasswordValid = await verifyPassword(password, account.passwordHash);

  if (!isPasswordValid) {
    return null;
  }

  await repository.update({
    where: { id: account.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    id: account.id,
    username: account.username,
    employeeUid: account.employeeUid,
    fullName: account.fullName,
    role: account.role,
    isActive: account.isActive,
  };
}


