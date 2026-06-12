import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { Role } from "@prisma/client";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) return null;

          const { email, password } = parsed.data;

          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
          });

          if (!user) return null;
          if (!user.isActive) return null;

          const isValidPassword = await bcrypt.compare(password, user.password);
          if (!isValidPassword) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            mustResetPassword: user.mustResetPassword,
            companyId: user.companyId,
            clientId: user.clientId,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  // `session`, `pages`, and the jwt/session `callbacks` are inherited from
  // `authConfig` (shared with the Edge middleware). Only the Node-runtime
  // pieces below — the Credentials provider above and the Prisma-backed
  // audit `events` — live in this file.
  events: {
    async signIn({ user }) {
      // Record login audit event
      if (user?.id) {
        await prisma.auditLog.create({
          data: {
            action: "LOGIN",
            entityType: "User",
            entityId: user.id,
            actorId: user.id,
            metadata: { email: user.email },
          },
        });
      }
    },
    async signOut(message) {
      // Record logout — token-based sessions carry userId in token
      const token = "token" in message ? message.token : null;
      if (token?.id) {
        await prisma.auditLog.create({
          data: {
            action: "LOGOUT",
            entityType: "User",
            entityId: token.id as string,
            actorId: token.id as string,
          },
        });
      }
    },
  },
});

// ─── RBAC helpers ─────────────────────────────────────────────

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized: Not authenticated");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== Role.ADMIN) {
    throw new Error("Forbidden: Admin access required");
  }
  return session;
}

// Allow any of the given roles; throws otherwise.
export async function requireRole(...roles: Role[]) {
  const session = await requireAuth();
  if (!roles.includes(session.user.role)) {
    throw new Error("Forbidden: insufficient role");
  }
  return session;
}

export function isAdmin(role: Role | string): boolean {
  return role === Role.ADMIN;
}

export function isEmployee(role: Role | string): boolean {
  return role === Role.EMPLOYEE;
}

export function isClient(role: Role | string): boolean {
  return role === Role.CLIENT;
}
