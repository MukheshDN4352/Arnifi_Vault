import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getUsers } from "@/actions/user.actions";
import { UserTable } from "@/components/users/user-table";
import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import { Plus } from "lucide-react";

export const metadata = { title: "Users" };

interface Props {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function UsersPage({ searchParams }: Props) {
  const [session, params] = await Promise.all([auth(), searchParams]);
  if (session?.user?.role !== "ADMIN") redirect("/unauthorized");

  const result = await getUsers({
    search: params.search,
    page: params.page ? Number(params.page) : 1,
    limit: 20,
  });

  return (
    <div className="page-container">
      <PageHeader
        title="Users"
        description="Manage system users and their access levels."
        badge={`${result.total} total`}
        actions={
          <Link
            href="/users/new"
            className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm"
          >
            <Plus className="w-4 h-4" />
            New User
          </Link>
        }
      />
      <UserTable result={result} currentUserId={session!.user.id} />
    </div>
  );
}
