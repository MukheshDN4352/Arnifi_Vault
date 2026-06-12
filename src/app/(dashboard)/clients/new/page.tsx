import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getCompaniesForSelect } from "@/actions/company.actions";
import { ClientForm } from "@/components/clients/client-form";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "New Client" };

export default async function NewClientPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/unauthorized");

  const companies = await getCompaniesForSelect();

  return (
    <div className="page-container max-w-2xl">
      <PageHeader
        title="New Client"
        description="Register a new client, optionally linked to a company."
      />
      <ClientForm companies={companies} />
    </div>
  );
}
