import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { getClients } from "@/actions/client.actions";
import { ClientTable } from "@/components/clients/client-table";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Clients" };

interface Props {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function ClientsPage({ searchParams }: Props) {
  const [session, params] = await Promise.all([auth(), searchParams]);
  const role = session?.user?.role;
  if (role !== "ADMIN" && role !== "EMPLOYEE") redirect("/unauthorized");
  const isAdmin = role === "ADMIN";

  const result = await getClients({
    search: params.search,
    page: params.page ? Number(params.page) : 1,
    limit: 20,
  });

  return (
    <div className="page-container">
      <PageHeader
        title="Clients"
        description="Individuals who own documents, optionally linked to a company."
        badge={`${result.total} total`}
        actions={
          isAdmin ? (
            <Link href="/clients/new" className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm">
              <Plus className="w-4 h-4" />
              New Client
            </Link>
          ) : undefined
        }
      />
      <ClientTable result={result} isAdmin={isAdmin} />
    </div>
  );
}
