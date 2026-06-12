import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import type { AuditFilters, PaginatedResult } from "@/types";
import type { AuditLog } from "@prisma/client";

// actorId has no FK relation (immutable, decoupled log), so the actor's
// name/email are resolved by a batch lookup and attached for display.
export type AuditLogWithActor = AuditLog & {
  actorName: string | null;
  actorEmail: string | null;
};

export const auditRepository = {
  async findAll(
    filters: AuditFilters = {}
  ): Promise<PaginatedResult<AuditLogWithActor>> {
    const {
      search,
      action,
      entityType,
      actorId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
    } = filters;

    const where: Prisma.AuditLogWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { entityId: { contains: search, mode: "insensitive" } },
                { action: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        action ? { action } : {},
        entityType ? { entityType } : {},
        actorId ? { actorId } : {},
        dateFrom ? { createdAt: { gte: new Date(dateFrom) } } : {},
        dateTo ? { createdAt: { lte: new Date(dateTo) } } : {},
      ],
    };

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Resolve actor display info in one batch query.
    const actorIds = [...new Set(rows.map((r) => r.actorId))];
    const actors = actorIds.length
      ? await prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const byId = new Map(actors.map((a) => [a.id, a]));

    const data: AuditLogWithActor[] = rows.map((r) => ({
      ...r,
      actorName: byId.get(r.actorId)?.name ?? null,
      actorEmail: byId.get(r.actorId)?.email ?? null,
    }));

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async create(data: {
    action: string;
    entityType: string;
    entityId: string;
    actorId: string;
    metadata?: Record<string, unknown>;
  }): Promise<AuditLog> {
    return prisma.auditLog.create({
      data: {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        actorId: data.actorId,
        ...(data.metadata
          ? { metadata: data.metadata as Prisma.InputJsonValue }
          : {}),
      },
    });
  },
};
