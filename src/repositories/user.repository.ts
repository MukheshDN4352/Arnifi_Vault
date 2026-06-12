import { prisma } from "@/lib/db/prisma";
import { Role, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import type {
  UserFilters,
  PaginatedResult,
  UserWithRelations,
  UserSafe,
} from "@/types";

// Company/client names attached to each user for the management screens.
const relationSelect = {
  company: { select: { id: true, name: true } },
  client: { select: { id: true, name: true } },
} as const;

export const userRepository = {
  async findAll(
    filters: UserFilters = {}
  ): Promise<PaginatedResult<UserWithRelations>> {
    const { search, role, isActive, page = 1, limit = 20 } = filters;

    const where: Prisma.UserWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        role !== undefined ? { role } : {},
        isActive !== undefined ? { isActive } : {},
      ],
    };

    const [rawData, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: relationSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const data = rawData.map(({ password: _p, ...rest }) => rest) as UserWithRelations[];
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findById(id: string): Promise<UserWithRelations | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: relationSelect,
    });
    if (!user) return null;
    const { password: _p, ...rest } = user;
    return rest as UserWithRelations;
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  },

  async create(data: {
    name: string;
    email: string;
    password: string;
    role: Role;
    companyId?: string | null;
    clientId?: string | null;
    mustResetPassword?: boolean;
  }): Promise<UserSafe> {
    const hashed = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        password: hashed,
        role: data.role,
        companyId: data.companyId ?? null,
        clientId: data.clientId ?? null,
        mustResetPassword: data.mustResetPassword ?? true,
      },
    });
    const { password: _p, ...safe } = user;
    return safe as UserSafe;
  },

  async update(
    id: string,
    data: {
      name?: string;
      email?: string;
      role?: Role;
      companyId?: string | null;
      clientId?: string | null;
      isActive?: boolean;
    }
  ): Promise<UserSafe> {
    const updateData: Prisma.UserUpdateInput = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email.toLowerCase();
    if (data.role) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    // Link / unlink the company or client account via the relation.
    if (data.companyId !== undefined) {
      updateData.company = data.companyId
        ? { connect: { id: data.companyId } }
        : { disconnect: true };
    }
    if (data.clientId !== undefined) {
      updateData.client = data.clientId
        ? { connect: { id: data.clientId } }
        : { disconnect: true };
    }

    const user = await prisma.user.update({ where: { id }, data: updateData });
    const { password: _p, ...safe } = user;
    return safe as UserSafe;
  },

  // Admin-set password: forces the user to change it again on next login.
  async resetPassword(id: string, newPassword: string): Promise<void> {
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id },
      data: { password: hashed, mustResetPassword: true },
    });
  },

  async setActive(id: string, isActive: boolean): Promise<UserSafe> {
    const user = await prisma.user.update({ where: { id }, data: { isActive } });
    const { password: _p, ...safe } = user;
    return safe as UserSafe;
  },

  async getCount() {
    const [total, admins, employees, clients, active] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: Role.ADMIN } }),
      prisma.user.count({ where: { role: Role.EMPLOYEE } }),
      prisma.user.count({ where: { role: Role.CLIENT } }),
      prisma.user.count({ where: { isActive: true } }),
    ]);
    return { total, admins, employees, clients, active };
  },

  async findBasicById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, isActive: true },
    });
  },
};
