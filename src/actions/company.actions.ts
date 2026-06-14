"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { requireAdmin, requireRole } from "@/lib/auth/auth";
import { companyRepository } from "@/repositories/company.repository";
import { documentRepository } from "@/repositories/document.repository";
import { auditRepository } from "@/repositories/audit.repository";
import { createCompanySchema } from "@/lib/validations/company";
import { Role } from "@prisma/client";
import type { ActionResult } from "@/types";
import type { Company } from "@prisma/client";

// The company select list changes only when a company is created. Cache the
// (pure, global) DB read and invalidate it via the "companies" tag, so the
// /documents filter dropdowns stop re-querying on every visit. The requireAdmin
// gate stays OUTSIDE the cache — role access is unchanged.
const cachedCompaniesForSelect = unstable_cache(
  () => companyRepository.findForSelect(),
  ["companies-for-select"],
  { tags: ["companies"] }
);

export async function getCompanies(
  filters: { search?: string; page?: number; limit?: number } = {}
) {
  await requireRole(Role.ADMIN, Role.EMPLOYEE);
  return companyRepository.findAll(filters);
}

export async function getCompaniesForSelect() {
  await requireAdmin();
  return cachedCompaniesForSelect();
}

export async function getCompany(id: string) {
  await requireRole(Role.ADMIN, Role.EMPLOYEE);
  return companyRepository.findById(id);
}

// A company's documents = its own + all its clients' (single companyId filter).
export async function getCompanyDocuments(id: string) {
  await requireRole(Role.ADMIN, Role.EMPLOYEE);
  return documentRepository.findByCompany(id);
}

export async function createCompany(
  formData: FormData
): Promise<ActionResult<Company>> {
  const session = await requireAdmin();

  const parsed = createCompanySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const existing = await companyRepository.findByName(parsed.data.name);
  if (existing) {
    return {
      success: false,
      message: "A company with this name already exists",
      errors: { name: ["This company name is already in use"] },
    };
  }

  try {
    const company = await companyRepository.create(parsed.data);
    await auditRepository.create({
      action: "COMPANY_CREATED",
      entityType: "Company",
      entityId: company.id,
      actorId: session.user.id,
      metadata: { name: company.name },
    });
    revalidatePath("/companies");
    revalidateTag("companies"); // refresh cached select list
    return { success: true, message: "Company created successfully", data: company };
  } catch (error) {
    console.error("Create company error:", error);
    return { success: false, message: "Failed to create company" };
  }
}
