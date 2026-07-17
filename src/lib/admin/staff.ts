import type { Account, Prisma } from "@prisma/client";
import { hashPassword } from "@/lib/password";
import { assertAdminAccount } from "@/lib/admin/authorization";
import { generateUniqueEmployeeUid, type EmployeeUidRepository } from "@/lib/admin/uid";
import type { PublicAccount } from "@/lib/auth/account";
import type { CreateStaffInput, ResetStaffPasswordInput } from "@/lib/admin/staff-schemas";

export type StaffRepository = EmployeeUidRepository & {
  create(args: { data: Prisma.AccountCreateInput }): Promise<Account>;
  update(args: { where: { id: string }; data: Prisma.AccountUpdateInput }): Promise<Account>;
  delete(args: { where: { id: string } }): Promise<Account>;
};

export async function createStaffForAdmin(
  account: PublicAccount,
  repository: Pick<StaffRepository, "findUnique" | "create">,
  input: CreateStaffInput,
): Promise<Account> {
  assertAdminAccount(account);

  const employeeUid = await generateUniqueEmployeeUid(repository);
  const passwordHash = await hashPassword(input.password);

  return repository.create({
    data: {
      username: null,
      employeeUid,
      fullName: input.fullName,
      passwordHash,
      role: "STAFF",
      isActive: true,
    },
  });
}

export async function resetStaffPasswordForAdmin(
  account: PublicAccount,
  repository: Pick<StaffRepository, "update">,
  input: ResetStaffPasswordInput,
): Promise<Account> {
  assertAdminAccount(account);

  return repository.update({
    where: { id: input.id },
    data: { passwordHash: await hashPassword(input.password) },
  });
}

export async function setStaffActiveForAdmin(
  account: PublicAccount,
  repository: Pick<StaffRepository, "update">,
  id: string,
  isActive: boolean,
): Promise<Account> {
  assertAdminAccount(account);

  return repository.update({
    where: { id },
    data: { isActive },
  });
}

export async function deleteStaffForAdmin(
  account: PublicAccount,
  repository: Pick<StaffRepository, "delete">,
  id: string,
): Promise<Account> {
  assertAdminAccount(account);

  return repository.delete({
    where: { id },
  });
}
