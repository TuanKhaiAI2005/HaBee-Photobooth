import type { AccountRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AccountRole;
    } & DefaultSession["user"];
  }

  interface User {
    role: AccountRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accountId: string;
    role: AccountRole;
  }
}
