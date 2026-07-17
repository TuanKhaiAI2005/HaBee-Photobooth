import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { prisma } from "@/lib/prisma";
import { toPublicAccount, type PublicAccount } from "@/lib/auth/account";
import { ForbiddenError } from "@/lib/auth/roles";

export async function getCurrentAccount(): Promise<PublicAccount | null> {
  const session = await auth();
  const accountId = session?.user?.id;

  if (!accountId) {
    return null;
  }

  const account = await prisma.account.findUnique({
    where: { id: accountId },
  });

  if (!account?.isActive) {
    return null;
  }

  return toPublicAccount(account);
}

export async function requireAdmin(): Promise<PublicAccount> {
  const account = await getCurrentAccount();

  if (!account) {
    redirect("/admin/login");
  }

  if (account.role !== "ADMIN") {
    throw new ForbiddenError();
  }

  return account;
}

export async function requireStaffOrAdmin(): Promise<PublicAccount> {
  const account = await getCurrentAccount();

  if (!account) {
    redirect("/staff/login");
  }

  if (account.role !== "ADMIN" && account.role !== "STAFF") {
    throw new ForbiddenError();
  }

  return account;
}

export async function redirectAuthenticatedAccount(): Promise<void> {
  const account = await getCurrentAccount();

  if (!account) {
    return;
  }

  if (account.role === "ADMIN") {
    redirect("/admin");
  }

  redirect("/staff");
}
