import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

/**
 * Edge-safe Auth.js configuration.
 *
 * This file is imported by the middleware, which runs in the Vercel Edge
 * runtime. It MUST NOT import anything that depends on Node.js APIs —
 * no Prisma, no bcryptjs, no `@auth/prisma-adapter`. Those live only in
 * `auth.ts`, which runs in the Node runtime (route handlers / server actions).
 *
 * The Credentials provider's `authorize` function (which needs Prisma + bcrypt)
 * is added in `auth.ts`. The middleware only needs to *read* the JWT, which is
 * Edge-compatible, so `providers: []` here is intentional.
 */
export const authConfig = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as Role;
        token.mustResetPassword = user.mustResetPassword ?? false;
        token.companyId = user.companyId ?? null;
        token.clientId = user.clientId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.mustResetPassword =
          (token.mustResetPassword as boolean) ?? false;
        session.user.companyId = (token.companyId as string | null) ?? null;
        session.user.clientId = (token.clientId as string | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
