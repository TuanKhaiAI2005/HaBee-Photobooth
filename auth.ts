import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { AccountRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authenticateAccount } from "@/lib/auth/account";
import { adminLoginSchema, staffLoginSchema } from "@/lib/auth/schemas";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  pages: {
    signIn: "/admin/login",
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    Credentials({
      id: "admin-login",
      name: "Admin credentials",
      credentials: {
        username: {},
        password: {},
      },
      async authorize(credentials) {
        const parsed = adminLoginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const account = await authenticateAccount(
          prisma.account,
          "admin",
          parsed.data.username,
          parsed.data.password,
        );

        if (!account) {
          return null;
        }

        return {
          id: account.id,
          name: account.fullName,
          role: account.role,
        };
      },
    }),
    Credentials({
      id: "staff-login",
      name: "Staff credentials",
      credentials: {
        employeeUid: {},
        password: {},
      },
      async authorize(credentials) {
        const parsed = staffLoginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const account = await authenticateAccount(
          prisma.account,
          "staff",
          parsed.data.employeeUid,
          parsed.data.password,
        );

        if (!account) {
          return null;
        }

        return {
          id: account.id,
          name: account.fullName,
          role: account.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.accountId = user.id;
        token.role = user.role;
      }

      return token;
    },
    session({ session, token }) {
      session.user.id = token.accountId as string;
      session.user.role = token.role as AccountRole;
      return session;
    },
    authorized({ auth: session }) {
      return Boolean(session?.user?.id);
    },
  },
});
