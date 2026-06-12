"use server";

import bcrypt from "bcryptjs";
import { requireAuth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { resetPasswordSchema } from "@/lib/validations/auth";
import type { ActionResult } from "@/types";

// The signed-in user sets a new password (used by the forced first-login reset).
export async function resetOwnPassword(
  formData: FormData
): Promise<ActionResult> {
  const session = await requireAuth();

  const parsed = resetPasswordSchema.safeParse({
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const password = await bcrypt.hash(parsed.data.newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password, mustResetPassword: false },
    });

    await prisma.auditLog.create({
      data: {
        action: "PASSWORD_RESET_SELF",
        entityType: "User",
        entityId: session.user.id,
        actorId: session.user.id,
      },
    });

    return { success: true, message: "Password updated. Please sign in again." };
  } catch (error) {
    console.error("Reset own password error:", error);
    return { success: false, message: "Failed to update password" };
  }
}
