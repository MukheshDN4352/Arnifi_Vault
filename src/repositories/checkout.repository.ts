import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import type { CheckoutFilters, PaginatedResult } from "@/types";
import type { CheckoutLog } from "@prisma/client";

export type CheckoutLogWithPerformer = CheckoutLog & {
  performerName: string | null;
};

type CheckoutData = {
  documentId: string;
  takenByName: string;
  takenByDetail?: string | null;
  purpose?: string | null;
  checkedOutAt: Date;
  performedByName?: string | null;
};

export const checkoutRepository = {
  /**
   * Check a document out of the vault. Terminal and atomic: verifies the doc is
   * AVAILABLE, flips it to CHECKED_OUT, writes a full CheckoutLog snapshot and an
   * AuditLog — all in one transaction.
   */
  async checkout(data: CheckoutData, performedById: string): Promise<CheckoutLog> {
    return prisma.$transaction(async (tx) => {
      const doc = await tx.document.findUnique({
        where: { id: data.documentId },
        include: {
          company: { select: { name: true } },
          client: { select: { name: true } },
        },
      });
      if (!doc) throw new Error("Document not found");
      if (doc.status !== "AVAILABLE") {
        throw new Error("Document is no longer available for checkout");
      }

      await tx.document.update({
        where: { id: doc.id },
        data: { status: "CHECKED_OUT" },
      });

      const log = await tx.checkoutLog.create({
        data: {
          documentId: doc.id,
          docCode: doc.code,
          docName: doc.name,
          ownerCompany: doc.company?.name ?? null,
          ownerClient: doc.client?.name ?? null,
          location: doc.location ?? null,
          lockerNo: doc.lockerNo,
          rackNo: doc.rackNo,
          takenByName: data.takenByName,
          takenByDetail: data.takenByDetail ?? null,
          purpose: data.purpose ?? null,
          checkedOutAt: data.checkedOutAt,
          performedById,
          performedByName: data.performedByName ?? null,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "DOCUMENT_CHECKED_OUT",
          entityType: "Document",
          entityId: doc.id,
          actorId: performedById,
          metadata: { code: doc.code, takenByName: data.takenByName },
        },
      });

      return log;
    });
  },

  async findAll(
    filters: CheckoutFilters = {}
  ): Promise<PaginatedResult<CheckoutLogWithPerformer>> {
    const { search, companyId, clientId, performedById, dateFrom, dateTo, page = 1, limit = 20 } =
      filters;

    const where: Prisma.CheckoutLogWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { docCode: { contains: search, mode: "insensitive" } },
                { docName: { contains: search, mode: "insensitive" } },
                { takenByName: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        companyId ? { document: { companyId } } : {},
        clientId ? { document: { clientId } } : {},
        performedById ? { performedById } : {},
        dateFrom ? { checkedOutAt: { gte: new Date(dateFrom) } } : {},
        dateTo ? { checkedOutAt: { lte: new Date(dateTo) } } : {},
      ],
    };

    const [rows, total] = await Promise.all([
      prisma.checkoutLog.findMany({
        where,
        orderBy: { checkedOutAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.checkoutLog.count({ where }),
    ]);

    const data = await attachPerformers(rows);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async getRecentCheckouts(limit = 8): Promise<CheckoutLogWithPerformer[]> {
    const rows = await prisma.checkoutLog.findMany({
      orderBy: { checkedOutAt: "desc" },
      take: limit,
    });
    return attachPerformers(rows);
  },

  async getStats() {
    return { totalCheckouts: await prisma.checkoutLog.count() };
  },

  // Most frequent takers (by name snapshot) for the dashboard.
  async getTopTakers(limit = 5) {
    const rows = await prisma.checkoutLog.groupBy({
      by: ["takenByName"],
      _count: { _all: true },
      orderBy: { _count: { takenByName: "desc" } },
      take: limit,
    });
    return rows.map((r) => ({ name: r.takenByName, count: r._count._all }));
  },

  // Checkouts per month for the last `months` months (no returns in this model).
  async getMonthlyActivity(months = 6) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    const rows = await prisma.checkoutLog.findMany({
      where: { checkedOutAt: { gte: start } },
      select: { checkedOutAt: true },
    });

    const buckets: { month: string; checkouts: number }[] = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
      buckets.push({
        month: d.toLocaleString("en-US", { month: "short", year: "2-digit" }),
        checkouts: 0,
      });
    }
    for (const r of rows) {
      const d = r.checkedOutAt;
      const idx =
        (d.getFullYear() - start.getFullYear()) * 12 + (d.getMonth() - start.getMonth());
      if (idx >= 0 && idx < buckets.length) buckets[idx].checkouts += 1;
    }
    return buckets;
  },
};

// Resolve performer names in one batch (performedById has no FK relation).
async function attachPerformers(
  rows: CheckoutLog[]
): Promise<CheckoutLogWithPerformer[]> {
  const ids = [...new Set(rows.map((r) => r.performedById))];
  const users = ids.length
    ? await prisma.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true },
      })
    : [];
  const byId = new Map(users.map((u) => [u.id, u.name]));
  // Prefer the name snapshotted at checkout; fall back to a live lookup for
  // older rows that predate the snapshot.
  return rows.map((r) => ({
    ...r,
    performerName: r.performedByName ?? byId.get(r.performedById) ?? null,
  }));
}
