import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import type { PaginatedResult, ClientListItem, ClientSelectItem } from "@/types";
import type { CreateClientInput } from "@/lib/validations/client";

export const clientRepository = {
  async findAll(
    filters: { search?: string; companyId?: string; page?: number; limit?: number } = {}
  ): Promise<PaginatedResult<ClientListItem>> {
    const { search, companyId, page = 1, limit = 20 } = filters;
    const where: Prisma.ClientWhereInput = {
      AND: [
        search ? { name: { contains: search, mode: "insensitive" } } : {},
        companyId ? { companyId } : {},
      ],
    };

    const [data, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          company: { select: { id: true, name: true } },
          _count: { select: { documents: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.client.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findById(id: string) {
    return prisma.client.findUnique({
      where: { id },
      include: { company: { select: { id: true, name: true } } },
    });
  },

  async findForSelect(): Promise<ClientSelectItem[]> {
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        name: true,
        companyId: true,
        company: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });
    return clients.map((c) => ({
      id: c.id,
      name: c.name,
      companyId: c.companyId,
      companyName: c.company?.name ?? null,
    }));
  },

  async exists(id: string): Promise<boolean> {
    const c = await prisma.client.findUnique({ where: { id }, select: { id: true } });
    return !!c;
  },

  async create(data: CreateClientInput) {
    return prisma.client.create({
      data: { name: data.name, companyId: data.companyId || null },
    });
  },

  async getCount() {
    return prisma.client.count();
  },
};
