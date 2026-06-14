"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { requireAdmin, requireRole } from "@/lib/auth/auth";
import { clientRepository } from "@/repositories/client.repository";
import { companyRepository } from "@/repositories/company.repository";
import { documentRepository } from "@/repositories/document.repository";
import { auditRepository } from "@/repositories/audit.repository";
import { createClientSchema } from "@/lib/validations/client";
import { Role } from "@prisma/client";
import type { ActionResult } from "@/types";
import type { Client } from "@prisma/client";

// The client select list changes only when a client is created. Cache the
// (pure, global) DB read and invalidate it via the "clients" tag, so the
// /documents filter dropdowns stop re-querying on every visit. The requireAdmin
// gate stays OUTSIDE the cache — role access is unchanged.
const cachedClientsForSelect = unstable_cache(
  () => clientRepository.findForSelect(),
  ["clients-for-select"],
  { tags: ["clients"] }
);

export async function getClients(
  filters: { search?: string; companyId?: string; page?: number; limit?: number } = {}
) {
  await requireRole(Role.ADMIN, Role.EMPLOYEE);
  return clientRepository.findAll(filters);
}

export async function getClientsForSelect() {
  await requireAdmin();
  return cachedClientsForSelect();
}

export async function getClient(id: string) {
  await requireRole(Role.ADMIN, Role.EMPLOYEE);
  return clientRepository.findById(id);
}

export async function getClientDocuments(id: string) {
  await requireRole(Role.ADMIN, Role.EMPLOYEE);
  return documentRepository.findByClient(id);
}

export async function createClient(
  formData: FormData
): Promise<ActionResult<Client>> {
  const session = await requireAdmin();

  const parsed = createClientSchema.safeParse({
    name: formData.get("name"),
    companyId: (formData.get("companyId") as string) || undefined,
  });
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  if (parsed.data.companyId) {
    const ok = await companyRepository.exists(parsed.data.companyId);
    if (!ok) {
      return {
        success: false,
        message: "Selected company does not exist",
        errors: { companyId: ["Invalid company"] },
      };
    }
  }

  try {
    const client = await clientRepository.create(parsed.data);
    await auditRepository.create({
      action: "CLIENT_CREATED",
      entityType: "Client",
      entityId: client.id,
      actorId: session.user.id,
      metadata: { name: client.name, companyId: parsed.data.companyId ?? null },
    });
    revalidatePath("/clients");
    revalidateTag("clients"); // refresh cached select list
    return { success: true, message: "Client created successfully", data: client };
  } catch (error) {
    console.error("Create client error:", error);
    return { success: false, message: "Failed to create client" };
  }
}
