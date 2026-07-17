import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const saltRounds = 12;

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME?.trim();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error("SEED_ADMIN_USERNAME and SEED_ADMIN_PASSWORD are required.");
  }

  const passwordHash = await bcrypt.hash(password, saltRounds);

  await prisma.account.upsert({
    where: { username },
    update: {
      passwordHash,
      role: "ADMIN",
      isActive: true,
      employeeUid: null,
    },
    create: {
      username,
      employeeUid: null,
      fullName: "Seed Admin",
      passwordHash,
      role: "ADMIN",
    },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Seed failed.");
    process.exit(1);
  });
