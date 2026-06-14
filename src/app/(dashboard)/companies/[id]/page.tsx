import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, UserSquare2, FileText, CheckCircle, Archive } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { getCompany, getCompanyDocuments } from "@/actions/company.actions";
import { getClients } from "@/actions/client.actions";
import { DocumentsList } from "@/components/documents/documents-list";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Company" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({ params }: Props) {
  const [session, { id }] = await Promise.all([auth(), params]);
  const role = session?.user?.role;
  if (role !== "ADMIN" && role !== "EMPLOYEE") redirect("/unauthorized");
  const isAdmin = role === "ADMIN";

  if (id === "new") redirect("/companies/new");

  const [company, documents, clientsResult] = await Promise.all([
    getCompany(id),
    getCompanyDocuments(id),
    getClients({ companyId: id, limit: 100 }),
  ]);
  if (!company) notFound();

  const available = documents.filter((d) => d.status === "AVAILABLE").length;
  const checkedOut = documents.filter((d) => d.status === "CHECKED_OUT").length;
  const clients = clientsResult.data;

  const stats = [
    { label: "Documents", value: documents.length, icon: FileText, color: "text-primary-600 bg-primary-50" },
    { label: "Available", value: available, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
    { label: "Checked Out", value: checkedOut, icon: Archive, color: "text-amber-600 bg-amber-50" },
    { label: "Clients", value: clients.length, icon: UserSquare2, color: "text-violet-600 bg-violet-50" },
  ];

  return (
    <div className="page-container space-y-6">
      <Link
        href="/companies"
        className="inline-flex items-center gap-2 text-sm font-medium text-arnifi-muted hover:text-arnifi-ink transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Companies
      </Link>

      <PageHeader
        title={company.name}
        description="All documents owned by this company and its clients."
        badge="Company"
      />

      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="vault-card flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-arnifi-ink leading-none">{s.value}</p>
                <p className="text-xs text-arnifi-muted mt-1">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Clients of this company */}
      {clients.length > 0 && (
        <div className="vault-card">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-primary-600" />
            <h2 className="text-sm font-semibold text-arnifi-ink">Clients</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {clients.map((c) => (
              <Link
                key={c.id}
                href={`/clients/${c.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-arnifi-bg border border-arnifi-border text-arnifi-ink hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 transition-colors"
              >
                <UserSquare2 className="w-3 h-3" />
                {c.name}
                <span className="text-arnifi-muted">· {c._count.documents}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-arnifi-ink">
          Documents <span className="text-arnifi-muted font-normal">({documents.length})</span>
        </h2>
        <DocumentsList
          documents={documents}
          showOwner
          isAdmin={isAdmin}
          emptyText="This company and its clients don't own any documents yet."
        />
      </div>
    </div>
  );
}
