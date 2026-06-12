import { z } from "zod";
import { Role } from "@prisma/client";
import { passwordSchema } from "./auth";

// Owner linkage is only meaningful for CLIENT logins; cross-field rules
// (at least one of company/client, and client-belongs-to-company) are
// enforced server-side in the action where a DB lookup is available.
export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .toLowerCase(),
  password: passwordSchema,
  role: z.nativeEnum(Role, { required_error: "Role is required" }),
  companyId: z.string().optional(),
  clientId: z.string().optional(),
});

export const updateUserSchema = z.object({
  id: z.string().cuid("Invalid user ID"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  email: z.string().email("Invalid email address").toLowerCase().optional(),
  role: z.nativeEnum(Role).optional(),
  companyId: z.string().optional(),
  clientId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const adminResetPasswordSchema = z.object({
  id: z.string().cuid("Invalid user ID"),
  newPassword: passwordSchema,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;
