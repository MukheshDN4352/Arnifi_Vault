import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { getDocuments } from "@/actions/document.actions";
import { DocumentTable } from "@/components/documents/document-table";
import { PageHeader } from "@/components/shared/page-header";
import type { DocStatus, VaultLocation } from "@prisma/client";

export const metadata = { title: "Documents" };

interface Props {
  searchParams: Promise<{
    search?: string;
    status?: string;
    category?: string;
    companyId?: string;
    clientId?: string;
    location?: string;
    lockerNo?: string;
    rackNo?: string;
    page?: string;
  }>;
}

export default async function DocumentsPage({ searchParams }: Props) {
  const [session, params] = await Promise.all([auth(), searchParams]);
  const isAdmin = session?.user?.role === "ADMIN";

  // Active vault shows AVAILABLE by default; "ALL" clears the status filter.
  const status = !params.status
    ? "AVAILABLE"
    : params.status === "ALL"
    ? undefined
    : params.status;

  const result = await getDocuments({
    search: params.search,
    status: status as DocStatus | undefined,
    category: params.category,
    companyId: params.companyId,
    clientId: params.clientId,
    location: params.location as VaultLocation | undefined,
    lockerNo: params.lockerNo,
    rackNo: params.rackNo,
    page: params.page ? Number(params.page) : 1,
    limit: 20,
  });

  return (
    <div className="page-container">
      <PageHeader
        title="Documents"
        description="All vault documents and their current status."
        badge={`${result.total} shown`}
        actions={
          isAdmin ? (
            <Link href="/documents/new" className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm">
              <Plus className="w-4 h-4" />
              New Document
            </Link>
          ) : undefined
        }
      />
      <DocumentTable result={result} isAdmin={isAdmin} />
    </div>
  );
}
