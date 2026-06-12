import type {
  User,
  Company,
  Client,
  Document,
  CheckoutLog,
  AuditLog,
  Role,
  DocStatus,
  VaultLocation,
} from "@prisma/client";

// ─── Re-export Prisma enums ─────────────────────────────────
export { Role, DocStatus, VaultLocation };
export type { User, Company, Client, Document, CheckoutLog, AuditLog };

// ─── Safe / derived entity types ────────────────────────────

export type UserSafe = Omit<User, "password">;

export type ClientWithCompany = Client & {
  company: Pick<Company, "id" | "name"> | null;
};

// ─── Management list / select shapes ────────────────────────

export type CompanyListItem = Company & {
  _count: { clients: number; documents: number };
};

export type ClientListItem = Client & {
  company: Pick<Company, "id" | "name"> | null;
  _count: { documents: number };
};

export type UserWithRelations = UserSafe & {
  company: Pick<Company, "id" | "name"> | null;
  client: Pick<Client, "id" | "name"> | null;
};

export interface SelectItem {
  id: string;
  name: string;
}

export interface ClientSelectItem extends SelectItem {
  companyId: string | null;
  companyName: string | null;
}

// Minimal owner shape attached to documents for display/selection.
export type DocumentWithOwner = Document & {
  company: Pick<Company, "id" | "name"> | null;
  client: Pick<Client, "id" | "name"> | null;
};

export type DocumentWithDetails = DocumentWithOwner & {
  checkoutLog: CheckoutLog | null;
};

// ─── Action response types ──────────────────────────────────

export interface ActionResult<T = void> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// ─── Pagination ─────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Filter / query types ───────────────────────────────────

export interface DocumentFilters {
  search?: string;
  status?: DocStatus;
  category?: string;
  companyId?: string;
  clientId?: string;
  location?: VaultLocation;
  lockerNo?: string;
  rackNo?: string;
  page?: number;
  limit?: number;
}

export interface CheckoutFilters {
  search?: string;
  companyId?: string;
  clientId?: string;
  performedById?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface AuditFilters {
  search?: string;
  action?: string;
  entityType?: string;
  actorId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface UserFilters {
  search?: string;
  role?: Role;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

// ─── Session types ──────────────────────────────────────────

export interface SessionUser {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  mustResetPassword: boolean;
  companyId: string | null;
  clientId: string | null;
}

// ─── S3 upload types ────────────────────────────────────────

export interface UploadUrlResponse {
  uploadUrl: string;
  fileKey: string;
  fileUrl: string;
}

export interface UploadedFile {
  fileKey: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}
