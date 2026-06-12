"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { requireAuth, requireAdmin } from "@/lib/auth/auth";
import { documentRepository } from "@/repositories/document.repository";
import { companyRepository } from "@/repositories/company.repository";
import { clientRepository } from "@/repositories/client.repository";
import { auditRepository } from "@/repositories/audit.repository";
import {
  createDocumentSchema,
  updateDocumentSchema,
} from "@/lib/validations/document";
import { documentScopeForUser } from "@/lib/db/scopes";
import { DOCUMENT_CATEGORIES } from "@/lib/constants";
import type { ActionResult, DocumentFilters } from "@/types";
import type { Document } from "@prisma/client";

// The distinct-category DB read changes only when a document is created/updated.
// Cache it (global, non-sensitive) under the "document-categories" tag so the
// /documents page stops re-running a DISTINCT scan on every visit.
const cachedUsedCategories = unstable_cache(
  () => documentRepository.getCategories(),
  ["document-categories"],
  { tags: ["document-categories"] }
);

// Base categories + any custom ones already saved, deduped & sorted. "Other"
// is the UI's "add new" affordance and is added by the form, not stored here.
export async function getDocumentCategories(): Promise<string[]> {
  await requireAuth();
  const used = await cachedUsedCategories();
  const merged = new Set<string>([
    ...DOCUMENT_CATEGORIES.filter((c) => c !== "Other"),
    ...used.filter((c) => c && c !== "Other"),
  ]);
  return Array.from(merged).sort((a, b) => a.localeCompare(b));
}

// Resolve & validate the document owner. A client-owned document also stores
// the client's company (derived) so company-scoped queries are a single filter.
async function resolveOwner(
  companyIdRaw?: string,
  clientIdRaw?: string
): Promise<{ companyId: string | null; clientId: string | null } | { error: string }> {
  const companyId = companyIdRaw || null;
  const clientId = clientIdRaw || null;
  if (!companyId && !clientId) return { error: "Select an owner — a company or a client" };

  if (clientId) {
    const client = await clientRepository.findById(clientId);
    if (!client) return { error: "Selected client does not exist" };
    return { companyId: client.companyId ?? null, clientId };
  }
  const ok = await companyRepository.exists(companyId!);
  if (!ok) return { error: "Selected company does not exist" };
  return { companyId, clientId: null };
}

function readDocumentForm(formData: FormData) {
  return {
    name: formData.get("name") as string,
    category: formData.get("category") as string,
    categoryOther: (formData.get("categoryOther") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
    companyId: (formData.get("companyId") as string) || undefined,
    clientId: (formData.get("clientId") as string) || undefined,
    location: (formData.get("location") as string) || undefined,
    lockerNo: (formData.get("lockerNo") as string) || undefined,
    rackNo: (formData.get("rackNo") as string) || undefined,
    fileKey: (formData.get("fileKey") as string) || undefined,
    fileUrl: (formData.get("fileUrl") as string) || undefined,
    fileName: (formData.get("fileName") as string) || undefined,
    fileSize: formData.get("fileSize") ? Number(formData.get("fileSize")) : undefined,
    mimeType: (formData.get("mimeType") as string) || undefined,
  };
}

export async function getDocuments(filters: DocumentFilters = {}) {
  const session = await requireAuth();
  return documentRepository.findAll(filters, documentScopeForUser(session.user));
}

export async function getDocument(id: string) {
  await requireAuth();
  return documentRepository.findById(id);
}

export async function getAvailableDocuments() {
  const session = await requireAuth();
  return documentRepository.findAvailable(documentScopeForUser(session.user));
}

export async function getDocumentStats() {
  const session = await requireAuth();
  return documentRepository.getStats(documentScopeForUser(session.user));
}

export async function createDocument(
  formData: FormData
): Promise<ActionResult<Document>> {
  const session = await requireAdmin();

  const parsed = createDocumentSchema.safeParse(readDocumentForm(formData));
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const owner = await resolveOwner(parsed.data.companyId, parsed.data.clientId);
  if ("error" in owner) {
    return { success: false, message: owner.error, errors: { companyId: [owner.error] } };
  }

  try {
    const d = parsed.data;
    // "Other" → persist the typed value as a first-class, reusable category.
    const category = d.category === "Other" ? (d.categoryOther ?? "").trim() : d.category;
    const document = await documentRepository.create({
      name: d.name,
      category,
      categoryOther: null,
      description: d.description ?? null,
      companyId: owner.companyId,
      clientId: owner.clientId,
      location: d.location,
      lockerNo: d.lockerNo,
      rackNo: d.rackNo,
      createdById: session.user.id,
      fileKey: d.fileKey ?? null,
      fileUrl: d.fileUrl || null,
      fileName: d.fileName ?? null,
      fileSize: d.fileSize ?? null,
      mimeType: d.mimeType ?? null,
    });

    await auditRepository.create({
      action: "DOCUMENT_CREATED",
      entityType: "Document",
      entityId: document.id,
      actorId: session.user.id,
      metadata: { code: document.code, name: document.name },
    });

    revalidatePath("/documents");
    revalidatePath("/dashboard");
    revalidateTag("document-categories"); // a new category may have been added
    return { success: true, message: "Document created successfully", data: document };
  } catch (error) {
    console.error("Create document error:", error);
    const detail = error instanceof Error ? error.message : "";
    return {
      success: false,
      message: detail ? `Failed to create document: ${detail}` : "Failed to create document",
    };
  }
}

export async function updateDocument(
  id: string,
  formData: FormData
): Promise<ActionResult<Document>> {
  const session = await requireAdmin();

  const parsed = updateDocumentSchema.safeParse({ id, ...readDocumentForm(formData) });
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const owner = await resolveOwner(parsed.data.companyId, parsed.data.clientId);
  if ("error" in owner) {
    return { success: false, message: owner.error, errors: { companyId: [owner.error] } };
  }

  try {
    const d = parsed.data;
    const category = d.category === "Other" ? (d.categoryOther ?? "").trim() : d.category;
    // The document scan is immutable after creation — file fields are
    // intentionally NOT included here, so an edit can never replace it.
    const document = await documentRepository.update(d.id, {
      name: d.name,
      category,
      categoryOther: null,
      description: d.description ?? null,
      companyId: owner.companyId,
      clientId: owner.clientId,
      location: d.location,
      lockerNo: d.lockerNo,
      rackNo: d.rackNo,
    });

    await auditRepository.create({
      action: "DOCUMENT_UPDATED",
      entityType: "Document",
      entityId: d.id,
      actorId: session.user.id,
      metadata: { code: document.code },
    });

    revalidatePath("/documents");
    revalidatePath(`/documents/${id}/edit`);
    revalidatePath("/dashboard");
    revalidateTag("document-categories"); // category may have changed
    return { success: true, message: "Document updated successfully", data: document };
  } catch (error) {
    console.error("Update document error:", error);
    return { success: false, message: "Failed to update document" };
  }
}
