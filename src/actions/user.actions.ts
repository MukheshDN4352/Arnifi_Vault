"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/auth";
import { userRepository } from "@/repositories/user.repository";
import { companyRepository } from "@/repositories/company.repository";
import { clientRepository } from "@/repositories/client.repository";
import { auditRepository } from "@/repositories/audit.repository";
import {
  createUserSchema,
  updateUserSchema,
  adminResetPasswordSchema,
} from "@/lib/validations/user";
import type { ActionResult, UserFilters } from "@/types";

export async function getUsers(filters: UserFilters = {}) {
  await requireAdmin();
  return userRepository.findAll(filters);
}

export async function getUser(id: string) {
  await requireAdmin();
  return userRepository.findById(id);
}

// Resolve & validate a CLIENT login's owner linkage against the DB.
async function resolveClientLinkage(
  companyIdRaw?: string,
  clientIdRaw?: string
): Promise<{ companyId: string | null; clientId: string | null } | { error: string }> {
  const companyId = companyIdRaw || null;
  const clientId = clientIdRaw || null;
  if (!companyId && !clientId) {
    return { error: "Select a company or a client for this login account" };
  }

  if (clientId) {
    const client = await clientRepository.findById(clientId);
    if (!client) return { error: "Selected client does not exist" };
    if (companyId && client.companyId && client.companyId !== companyId) {
      return { error: "Selected client does not belong to the selected company" };
    }
    // A client login derives its company from the client record.
    return { companyId: client.companyId ?? companyId, clientId };
  }

  const ok = await companyRepository.exists(companyId!);
  if (!ok) return { error: "Selected company does not exist" };
  return { companyId, clientId: null };
}

export async function createUser(formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    companyId: (formData.get("companyId") as string) || undefined,
    clientId: (formData.get("clientId") as string) || undefined,
  });
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const existing = await userRepository.findByEmail(parsed.data.email);
  if (existing) {
    return {
      success: false,
      message: "A user with this email already exists",
      errors: { email: ["This email is already registered"] },
    };
  }

  let companyId: string | null = null;
  let clientId: string | null = null;
  if (parsed.data.role === Role.CLIENT) {
    const linkage = await resolveClientLinkage(parsed.data.companyId, parsed.data.clientId);
    if ("error" in linkage) {
      return { success: false, message: linkage.error, errors: { clientId: [linkage.error] } };
    }
    companyId = linkage.companyId;
    clientId = linkage.clientId;
  }

  try {
    // privilege: admin can create admins
    const user = await userRepository.create({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      role: parsed.data.role,
      companyId,
      clientId,
      mustResetPassword: true, // forced change on first login
    });
    await auditRepository.create({
      action: "USER_CREATED",
      entityType: "User",
      entityId: user.id,
      actorId: session.user.id,
      metadata: { email: user.email, role: user.role },
    });
    revalidatePath("/users");
    return {
      success: true,
      message: "User created. They'll set a new password on first login.",
    };
  } catch (error) {
    console.error("Create user error:", error);
    return { success: false, message: "Failed to create user" };
  }
}

export async function updateUser(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = updateUserSchema.safeParse({
    id,
    name: formData.get("name") || undefined,
    email: formData.get("email") || undefined,
    role: formData.get("role") || undefined,
    companyId: (formData.get("companyId") as string) || undefined,
    clientId: (formData.get("clientId") as string) || undefined,
  });
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  let companyId: string | null | undefined;
  let clientId: string | null | undefined;
  if (parsed.data.role === Role.CLIENT) {
    const linkage = await resolveClientLinkage(parsed.data.companyId, parsed.data.clientId);
    if ("error" in linkage) {
      return { success: false, message: linkage.error, errors: { clientId: [linkage.error] } };
    }
    companyId = linkage.companyId;
    clientId = linkage.clientId;
  } else if (parsed.data.role) {
    // Non-client roles carry no owner linkage.
    companyId = null;
    clientId = null;
  }

  try {
    const { id: userId, name, email, role, isActive } = parsed.data;
    await userRepository.update(userId, {
      name,
      email,
      role,
      isActive,
      companyId,
      clientId,
    });
    await auditRepository.create({
      action: "USER_UPDATED",
      entityType: "User",
      entityId: userId,
      actorId: session.user.id,
    });
    revalidatePath("/users");
    revalidatePath(`/users/${id}`);
    return { success: true, message: "User updated successfully" };
  } catch (error) {
    console.error("Update user error:", error);
    return { success: false, message: "Failed to update user" };
  }
}

// Admin sets a new password for a user; forces them to change it next login.
export async function resetUserPassword(
  formData: FormData
): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = adminResetPasswordSchema.safeParse({
    id: formData.get("id"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await userRepository.resetPassword(parsed.data.id, parsed.data.newPassword);
    await auditRepository.create({
      action: "USER_PASSWORD_RESET",
      entityType: "User",
      entityId: parsed.data.id,
      actorId: session.user.id,
    });
    revalidatePath(`/users/${parsed.data.id}`);
    return {
      success: true,
      message: "Password reset. The user must change it on next login.",
    };
  } catch (error) {
    console.error("Reset user password error:", error);
    return { success: false, message: "Failed to reset password" };
  }
}

export async function deactivateUser(id: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (id === session.user.id) {
    return { success: false, message: "You cannot deactivate your own account" };
  }
  try {
    await userRepository.setActive(id, false);
    await auditRepository.create({
      action: "USER_DEACTIVATED",
      entityType: "User",
      entityId: id,
      actorId: session.user.id,
    });
    revalidatePath("/users");
    return { success: true, message: "User deactivated successfully" };
  } catch (error) {
    console.error("Deactivate user error:", error);
    return { success: false, message: "Failed to deactivate user" };
  }
}

export async function activateUser(id: string): Promise<ActionResult> {
  const session = await requireAdmin();
  try {
    await userRepository.setActive(id, true);
    await auditRepository.create({
      action: "USER_ACTIVATED",
      entityType: "User",
      entityId: id,
      actorId: session.user.id,
    });
    revalidatePath("/users");
    return { success: true, message: "User activated successfully" };
  } catch (error) {
    console.error("Activate user error:", error);
    return { success: false, message: "Failed to activate user" };
  }
}
