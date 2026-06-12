import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getCompaniesForSelect } from "@/actions/company.actions";
import { getClientsForSelect } from "@/actions/client.actions";
import { UserForm } from "@/components/users/user-form";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "New User" };

export default async function NewUserPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/unauthorized");

  const [companies, clients] = await Promise.all([
    getCompaniesForSelect(),
    getClientsForSelect(),
  ]);

  return (
    <div className="page-container max-w-3xl">
      <PageHeader
        title="New User"
        description="Create a login account and assign its role and access."
      />
      <UserForm mode="create" companies={companies} clients={clients} />
    </div>
  );
}
