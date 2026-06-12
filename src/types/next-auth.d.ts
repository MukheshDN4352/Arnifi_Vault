import "next-auth";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    role: Role;
    id: string;
    mustResetPassword?: boolean;
    companyId?: string | null;
    clientId?: string | null;
  }
  interface Session {
    user: {
      id: string;
      name: string | null;
      email: string;
      role: Role;
      mustResetPassword: boolean;
      companyId: string | null;
      clientId: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    mustResetPassword: boolean;
    companyId: string | null;
    clientId: string | null;
  }
}
