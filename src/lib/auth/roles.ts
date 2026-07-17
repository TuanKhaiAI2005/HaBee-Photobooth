import type { AccountRole } from "@prisma/client";
import type { PublicAccount } from "@/lib/auth/account";

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function assertRole(account: PublicAccount | null, allowedRoles: AccountRole[]): PublicAccount {
  if (!account) {
    throw new Error("Unauthorized");
  }

  if (!allowedRoles.includes(account.role)) {
    throw new ForbiddenError();
  }

  return account;
}
