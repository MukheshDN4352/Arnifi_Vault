import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getCompaniesForSelect } from "@/actions/company.actions";
import { getClientsForSelect } from "@/actions/client.actions";
import { getDocumentCategories } from "@/actions/document.actions";
import { DocumentForm } from "@/components/documents/document-form";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "New Document" };

export default async function NewDocumentPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/unauthorized");

  const [companies, clients, categories] = await Promise.all([
    getCompaniesForSelect(),
    getClientsForSelect(),
    getDocumentCategories(),
  ]);

  return (
    <div className="page-container max-w-3xl">
      <PageHeader
        title="New Document"
        description="Add a new document to the vault registry."
      />
      <DocumentForm
        mode="create"
        companies={companies}
        clients={clients}
        categories={categories}
      />
    </div>
  );
}
