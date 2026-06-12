import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getUser } from "@/actions/user.actions";
import { getCompaniesForSelect } from "@/actions/company.actions";
import { getClientsForSelect } from "@/actions/client.actions";
import { UserForm } from "@/components/users/user-form";
import { UserPasswordReset } from "@/components/users/user-password-reset";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Edit User" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: Props) {
  const [session, { id }] = await Promise.all([auth(), params]);
  if (session?.user?.role !== "ADMIN") redirect("/unauthorized");

  // "new" is handled by /users/new; redirect if hit here directly.
  if (id === "new") redirect("/users/new");

  const [user, companies, clients] = await Promise.all([
    getUser(id),
    getCompaniesForSelect(),
    getClientsForSelect(),
  ]);
  if (!user) notFound();

  return (
    <div className="page-container max-w-3xl space-y-6">
      <PageHeader
        title={user.name ?? user.email}
        description="Edit this account's details, role, and access."
        badge={user.role}
      />
      <UserForm mode="edit" user={user} companies={companies} clients={clients} />
      <UserPasswordReset userId={user.id} />
    </div>
  );
}
