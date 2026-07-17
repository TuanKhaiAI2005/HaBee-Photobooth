import type { PublicAccount } from "@/lib/auth/account";
import { ForbiddenError } from "@/lib/auth/roles";

export function assertAdminAccount(account: PublicAccount): void {
  if (account.role !== "ADMIN") {
    throw new ForbiddenError();
  }
}
