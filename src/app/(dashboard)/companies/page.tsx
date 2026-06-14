import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { getCompanies } from "@/actions/company.actions";
import { CompanyTable } from "@/components/companies/company-table";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Companies" };

interface Props {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function CompaniesPage({ searchParams }: Props) {
  const [session, params] = await Promise.all([auth(), searchParams]);
  const role = session?.user?.role;
  if (role !== "ADMIN" && role !== "EMPLOYEE") redirect("/unauthorized");
  const isAdmin = role === "ADMIN";

  const result = await getCompanies({
    search: params.search,
    page: params.page ? Number(params.page) : 1,
    limit: 20,
  });

  return (
    <div className="page-container">
      <PageHeader
        title="Companies"
        description="Organisations that own documents and may have client logins."
        badge={`${result.total} total`}
        actions={
          isAdmin ? (
            <Link href="/companies/new" className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm">
              <Plus className="w-4 h-4" />
              New Company
            </Link>
          ) : undefined
        }
      />
      <CompanyTable result={result} isAdmin={isAdmin} />
    </div>
  );
}
