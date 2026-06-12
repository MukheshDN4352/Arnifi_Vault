"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/auth";
import { checkoutRepository } from "@/repositories/checkout.repository";
import { createCheckoutSchema } from "@/lib/validations/checkout";
import type { ActionResult, CheckoutFilters } from "@/types";

// Checkout logs are admin-only (per the permissions matrix).
export async function getCheckouts(filters: CheckoutFilters = {}) {
  await requireAdmin();
  return checkoutRepository.findAll(filters);
}

export async function getRecentCheckouts(limit = 8) {
  await requireAdmin();
  return checkoutRepository.getRecentCheckouts(limit);
}

export async function getMonthlyActivity(months = 6) {
  await requireAdmin();
  return checkoutRepository.getMonthlyActivity(months);
}

export async function createCheckout(formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = createCheckoutSchema.safeParse({
    documentId: formData.get("documentId"),
    takenByName: formData.get("takenByName"),
    takenByDetail: (formData.get("takenByDetail") as string) || undefined,
    purpose: (formData.get("purpose") as string) || undefined,
    checkedOutAt: formData.get("checkedOutAt"),
  });
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const checkedOutAt = new Date(parsed.data.checkedOutAt);
  if (Number.isNaN(checkedOutAt.getTime())) {
    return {
      success: false,
      message: "Invalid checkout date/time",
      errors: { checkedOutAt: ["Enter a valid date and time"] },
    };
  }

  try {
    await checkoutRepository.checkout(
      {
        documentId: parsed.data.documentId,
        takenByName: parsed.data.takenByName,
        takenByDetail: parsed.data.takenByDetail ?? null,
        purpose: parsed.data.purpose ?? null,
        checkedOutAt,
        // Snapshot the issuing admin's name so "Issued By" never depends on a
        // later id lookup (robust against session/id changes).
        performedByName: session.user.name ?? null,
      },
      session.user.id
    );

    revalidatePath("/documents");
    revalidatePath("/checkout-history");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Document checked out to ${parsed.data.takenByName}`,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to check out document";
    return { success: false, message };
  }
}
