import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import type { PaginatedResult, CompanyListItem, SelectItem } from "@/types";
import type { CreateCompanyInput } from "@/lib/validations/company";

export const companyRepository = {
  async findAll(
    filters: { search?: string; page?: number; limit?: number } = {}
  ): Promise<PaginatedResult<CompanyListItem>> {
    const { search, page = 1, limit = 20 } = filters;
    const where: Prisma.CompanyWhereInput = search
      ? { name: { contains: search, mode: "insensitive" } }
      : {};

    const [data, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: { _count: { select: { clients: true, documents: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.company.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findById(id: string) {
    return prisma.company.findUnique({
      where: { id },
      include: { _count: { select: { clients: true, documents: true } } },
    });
  },

  async findByName(name: string) {
    return prisma.company.findUnique({ where: { name } });
  },

  async findForSelect(): Promise<SelectItem[]> {
    return prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  },

  async exists(id: string): Promise<boolean> {
    const c = await prisma.company.findUnique({ where: { id }, select: { id: true } });
    return !!c;
  },

  async create(data: CreateCompanyInput) {
    return prisma.company.create({ data: { name: data.name } });
  },

  async getCount() {
    return prisma.company.count();
  },
};
