import type { Prisma } from "@prisma/client";

/**
 * Documents a user may see, expressed as a Prisma where-clause:
 *   - ADMIN / EMPLOYEE  → undefined (no restriction; they see everything)
 *   - CLIENT (individual)→ documents owned by their client
 *   - CLIENT (company)   → documents owned by their company (client-owned docs
 *                          also carry the derived companyId, so one filter covers
 *                          both the company's and its clients' documents)
 *   - CLIENT with no link → nothing
 */
export function documentScopeForUser(user: {
  role: string;
  companyId: string | null;
  clientId: string | null;
}): Prisma.DocumentWhereInput | undefined {
  if (user.role === "ADMIN" || user.role === "EMPLOYEE") return undefined;

  if (user.clientId) return { clientId: user.clientId };
  if (user.companyId) return { companyId: user.companyId };

  // CLIENT login with no linkage — deny everything.
  return { id: "__none__" };
}
