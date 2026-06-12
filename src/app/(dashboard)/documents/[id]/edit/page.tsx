import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getCompaniesForSelect } from "@/actions/company.actions";
import { getClientsForSelect } from "@/actions/client.actions";
import { getDocument, getDocumentCategories } from "@/actions/document.actions";
import { DocumentForm } from "@/components/documents/document-form";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Edit Document" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditDocumentPage({ params }: Props) {
  const [session, { id }] = await Promise.all([auth(), params]);
  if (session?.user?.role !== "ADMIN") redirect("/unauthorized");

  const [document, companies, clients, categories] = await Promise.all([
    getDocument(id),
    getCompaniesForSelect(),
    getClientsForSelect(),
    getDocumentCategories(),
  ]);
  if (!document) notFound();

  return (
    <div className="page-container max-w-3xl">
      <PageHeader
        title="Edit Document"
        description={`Editing: ${document.name}`}
        badge={document.code}
      />
      <DocumentForm
        mode="edit"
        document={document}
        companies={companies}
        clients={clients}
        categories={categories}
      />
    </div>
  );
}
