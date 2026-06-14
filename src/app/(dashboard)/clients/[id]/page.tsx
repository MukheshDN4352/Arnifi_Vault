import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, FileText, CheckCircle, Archive } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { getClient, getClientDocuments } from "@/actions/client.actions";
import { DocumentsList } from "@/components/documents/documents-list";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Client" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: Props) {
  const [session, { id }] = await Promise.all([auth(), params]);
  const role = session?.user?.role;
  if (role !== "ADMIN" && role !== "EMPLOYEE") redirect("/unauthorized");
  const isAdmin = role === "ADMIN";

  if (id === "new") redirect("/clients/new");

  const [client, documents] = await Promise.all([
    getClient(id),
    getClientDocuments(id),
  ]);
  if (!client) notFound();

  const available = documents.filter((d) => d.status === "AVAILABLE").length;
  const checkedOut = documents.filter((d) => d.status === "CHECKED_OUT").length;

  const stats = [
    { label: "Documents", value: documents.length, icon: FileText, color: "text-primary-600 bg-primary-50" },
    { label: "Available", value: available, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
    { label: "Checked Out", value: checkedOut, icon: Archive, color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div className="page-container space-y-6">
      <Link
        href="/clients"
        className="inline-flex items-center gap-2 text-sm font-medium text-arnifi-muted hover:text-arnifi-ink transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Clients
      </Link>

      <PageHeader
        title={client.name}
        description="Documents owned by this client."
        badge="Client"
      />

      {/* Company link / individual */}
      <div className="vault-card flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-primary-600" />
        </div>
        <div>
          <p className="text-xs text-arnifi-muted">Company</p>
          {client.company ? (
            <Link
              href={`/companies/${client.company.id}`}
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              {client.company.name}
            </Link>
          ) : (
            <p className="text-sm font-medium text-arnifi-ink">Individual (no company)</p>
          )}
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-4">
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

      {/* Documents */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-arnifi-ink">
          Documents <span className="text-arnifi-muted font-normal">({documents.length})</span>
        </h2>
        <DocumentsList documents={documents} isAdmin={isAdmin} emptyText="This client doesn't own any documents yet." />
      </div>
    </div>
  );
}
