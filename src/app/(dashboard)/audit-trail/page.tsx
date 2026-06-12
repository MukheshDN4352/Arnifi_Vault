import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getAuditLogs } from "@/actions/audit.actions";
import { AuditTable } from "@/components/audit/audit-table";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Audit Trail" };

interface Props {
  searchParams: Promise<{
    search?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}

export default async function AuditTrailPage({ searchParams }: Props) {
  const [session, params] = await Promise.all([auth(), searchParams]);
  if (session?.user?.role !== "ADMIN") redirect("/unauthorized");

  const result = await getAuditLogs({
    search: params.search,
    action: params.action || undefined,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    page: params.page ? Number(params.page) : 1,
    limit: 25,
  });

  return (
    <div className="page-container">
      <PageHeader
        title="Audit Trail"
        description="Complete immutable record of all system events and actions."
        badge={`${result.total} records`}
      />
      <AuditTable result={result} />
    </div>
  );
}
