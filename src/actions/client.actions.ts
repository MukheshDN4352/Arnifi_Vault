"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/auth";
import { clientRepository } from "@/repositories/client.repository";
import { companyRepository } from "@/repositories/company.repository";
import { documentRepository } from "@/repositories/document.repository";
import { auditRepository } from "@/repositories/audit.repository";
import { createClientSchema } from "@/lib/validations/client";
import type { ActionResult } from "@/types";
import type { Client } from "@prisma/client";

export async function getClients(
  filters: { search?: string; companyId?: string; page?: number; limit?: number } = {}
) {
  await requireAdmin();
  return clientRepository.findAll(filters);
}

export async function getClientsForSelect() {
  await requireAdmin();
  return clientRepository.findForSelect();
}

export async function getClient(id: string) {
  await requireAdmin();
  return clientRepository.findById(id);
}

export async function getClientDocuments(id: string) {
  await requireAdmin();
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
    return { success: true, message: "Client created successfully", data: client };
  } catch (error) {
    console.error("Create client error:", error);
    return { success: false, message: "Failed to create client" };
  }
}
