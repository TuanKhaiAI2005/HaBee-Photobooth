export function generateEmployeeUid(random = Math.random): string {
  const value = Math.floor(random() * 1_000_000);
  return `NV-${value.toString().padStart(6, "0")}`;
}

export type EmployeeUidRepository = {
  findUnique(args: { where: { employeeUid: string } }): Promise<unknown | null>;
};

export async function generateUniqueEmployeeUid(
  repository: EmployeeUidRepository,
  random = Math.random,
): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const employeeUid = generateEmployeeUid(random);
    const existing = await repository.findUnique({ where: { employeeUid } });

    if (!existing) {
      return employeeUid;
    }
  }

  throw new Error("Không thể sinh UID nhân viên duy nhất.");
}

