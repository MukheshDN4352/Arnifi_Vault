"use server";

import { requireAdmin } from "@/lib/auth/auth";
import { auditRepository } from "@/repositories/audit.repository";
import type { AuditFilters } from "@/types";

export async function getAuditLogs(filters: AuditFilters = {}) {
  await requireAdmin();
  return auditRepository.findAll(filters);
}
