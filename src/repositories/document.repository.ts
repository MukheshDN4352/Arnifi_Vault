import { prisma } from "@/lib/db/prisma";
import { Prisma, VaultLocation } from "@prisma/client";
import { generateDocumentId } from "@/lib/utils/format";
import type {
  DocumentFilters,
  PaginatedResult,
  DocumentWithOwner,
} from "@/types";

const ownerInclude = {
  company: { select: { id: true, name: true } },
  client: { select: { id: true, name: true } },
} as const;

type DocumentWriteData = {
  name: string;
  category: string;
  categoryOther?: string | null;
  description?: string | null;
  companyId?: string | null;
  clientId?: string | null;
  location: VaultLocation;
  lockerNo: string;
  rackNo: string;
  fileKey?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
};

export const documentRepository = {
  async findAll(
    filters: DocumentFilters = {},
    scope?: Prisma.DocumentWhereInput
  ): Promise<PaginatedResult<DocumentWithOwner>> {
    const {
      search,
      status,
      category,
      companyId,
      clientId,
      location,
      lockerNo,
      rackNo,
      page = 1,
      limit = 20,
    } = filters;

    const where: Prisma.DocumentWhereInput = {
      AND: [
        scope ?? {},
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { code: { contains: search, mode: "insensitive" } },
                { category: { contains: search, mode: "insensitive" } },
                { company: { name: { contains: search, mode: "insensitive" } } },
                { client: { name: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {},
        status ? { status } : {},
        category ? { category } : {},
        companyId ? { companyId } : {},
        clientId ? { clientId } : {},
        location ? { location } : {},
        lockerNo ? { lockerNo } : {},
        rackNo ? { rackNo } : {},
      ],
    };

    const [data, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: ownerInclude,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.document.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findById(id: string) {
    return prisma.document.findUnique({
      where: { id },
      include: { ...ownerInclude, checkoutLog: true },
    });
  },

  // Look up a single document the given user is allowed to see. Returns null
  // when it doesn't exist OR falls outside the user's scope — used to gate
  // file access so a CLIENT can't view another owner's scan by guessing ids.
  async findByIdScoped(id: string, scope?: Prisma.DocumentWhereInput) {
    return prisma.document.findFirst({
      where: { AND: [scope ?? {}, { id }] },
    });
  },

  async findByCode(code: string) {
    return prisma.document.findUnique({ where: { code } });
  },

  // Distinct category values actually in use — feeds the (persisted) category list.
  async getCategories(): Promise<string[]> {
    const rows = await prisma.document.findMany({
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });
    return rows.map((r) => r.category);
  },

  // All documents owned by a company — includes its clients' documents, since
  // client-owned docs carry the derived companyId.
  async findByCompany(companyId: string) {
    return prisma.document.findMany({
      where: { companyId },
      include: ownerInclude,
      orderBy: { createdAt: "desc" },
    });
  },

  // Documents owned directly by a specific client.
  async findByClient(clientId: string) {
    return prisma.document.findMany({
      where: { clientId },
      include: ownerInclude,
      orderBy: { createdAt: "desc" },
    });
  },

  async create(data: DocumentWriteData & { createdById: string }) {
    const count = await prisma.document.count();
    const code = generateDocumentId(count);
    return prisma.document.create({ data: { ...data, code } });
  },

  async update(id: string, data: Partial<DocumentWriteData>) {
    return prisma.document.update({ where: { id }, data });
  },

  // Counts for the dashboard, optionally scoped to a client's documents.
  async getStats(scope?: Prisma.DocumentWhereInput) {
    const base = scope ?? {};
    const [total, available, checkedOut] = await Promise.all([
      prisma.document.count({ where: base }),
      prisma.document.count({ where: { AND: [base, { status: "AVAILABLE" }] } }),
      prisma.document.count({ where: { AND: [base, { status: "CHECKED_OUT" }] } }),
    ]);
    return { total, available, checkedOut };
  },

  // Document count per storage location (for the dashboard breakdown).
  async getLocationBreakdown(scope?: Prisma.DocumentWhereInput) {
    const rows = await prisma.document.groupBy({
      by: ["location"],
      where: scope ?? {},
      _count: { _all: true },
    });
    return rows.map((r) => ({ location: r.location, count: r._count._all }));
  },

  async findAvailable(scope?: Prisma.DocumentWhereInput) {
    return prisma.document.findMany({
      where: { AND: [scope ?? {}, { status: "AVAILABLE" }] },
      include: ownerInclude,
      orderBy: { name: "asc" },
    });
  },
};
