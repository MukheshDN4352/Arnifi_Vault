"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Search, Plus, Edit, UserX, UserCheck, Users } from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils/format";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { deactivateUser, activateUser } from "@/actions/user.actions";
import type { PaginatedResult, UserWithRelations } from "@/types";

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-primary-50 text-primary-700 border-primary-100",
  EMPLOYEE: "bg-blue-50 text-blue-700 border-blue-100",
  CLIENT: "bg-amber-50 text-amber-700 border-amber-100",
};

interface UserTableProps {
  result: PaginatedResult<UserWithRelations>;
  currentUserId: string;
}

function accountLabel(user: UserWithRelations): string {
  if (user.role !== "CLIENT") return "—";
  if (user.client) return `${user.client.name} (client)`;
  if (user.company) return `${user.company.name} (company)`;
  return "—";
}

export function UserTable({ result, currentUserId }: UserTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [confirmUser, setConfirmUser] = useState<{
    user: UserWithRelations;
    action: "deactivate" | "activate";
  } | null>(null);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const updateParams = useCallback(
    (params: Record<string, string>) => {
      const current = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([k, v]) => (v ? current.set(k, v) : current.delete(k)));
      current.set("page", "1");
      startTransition(() => router.push(`${pathname}?${current.toString()}`));
    },
    [pathname, router, searchParams]
  );

  const handlePage = (page: number) => {
    const current = new URLSearchParams(searchParams.toString());
    current.set("page", String(page));
    startTransition(() => router.push(`${pathname}?${current.toString()}`));
  };

  const handleConfirm = async () => {
    if (!confirmUser) return;
    const res =
      confirmUser.action === "deactivate"
        ? await deactivateUser(confirmUser.user.id)
        : await activateUser(confirmUser.user.id);
    if (res.success) {
      toast.success(res.message);
      router.refresh();
    } else {
      toast.error(res.message);
    }
    setConfirmUser(null);
  };

  const { data: users, total, page, limit, totalPages } = result;

  return (
    <>
      <div className="vault-card p-0 overflow-hidden">
        <div className="p-4 border-b border-arnifi-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-arnifi-muted" />
            <input
              type="text"
              placeholder="Search users by name or email…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                updateParams({ search: e.target.value });
              }}
              className="vault-input pl-10 h-9 text-sm"
            />
          </div>
          <Link
            href="/users/new"
            className="btn-primary flex items-center gap-2 px-3.5 py-2 text-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New User</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>

        {users.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? "No users found" : "No users yet"}
            description={search ? "Try adjusting your search." : "Create your first user to get started."}
          />
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full vault-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Account</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {getInitials(user.name ?? user.email)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-arnifi-ink">
                              <Link href={`/users/${user.id}`} className="hover:text-primary-700 hover:underline">
                                {user.name ?? "—"}
                              </Link>
                              {user.id === currentUserId && (
                                <span className="ml-2 text-[10px] text-primary-600 font-semibold bg-primary-50 px-1.5 py-0.5 rounded-md">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-arnifi-muted">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_BADGE[user.role] ?? ""}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="text-xs text-arnifi-muted">{accountLabel(user)}</td>
                      <td>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit ${
                            user.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-gray-50 text-gray-500 border border-gray-200"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="text-xs text-arnifi-muted">{formatDate(user.createdAt)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/users/${user.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-arnifi-muted hover:bg-primary-50 hover:text-primary-700 border border-arnifi-border transition-colors"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </Link>
                          {user.id !== currentUserId && (
                            <button
                              onClick={() =>
                                setConfirmUser({
                                  user,
                                  action: user.isActive ? "deactivate" : "activate",
                                })
                              }
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                user.isActive
                                  ? "text-red-600 hover:bg-red-50 border-red-200"
                                  : "text-emerald-600 hover:bg-emerald-50 border-emerald-200"
                              }`}
                            >
                              {user.isActive ? (
                                <><UserX className="w-3 h-3" /> Deactivate</>
                              ) : (
                                <><UserCheck className="w-3 h-3" /> Activate</>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-arnifi-border">
              {users.map((user) => (
                <div key={user.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {getInitials(user.name ?? user.email)}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/users/${user.id}`} className="text-sm font-semibold text-arnifi-ink truncate block hover:text-primary-700">
                          {user.name ?? "—"}
                        </Link>
                        <p className="text-xs text-arnifi-muted truncate">{user.email}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${ROLE_BADGE[user.role] ?? ""}`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/users/${user.id}`} className="flex-1 text-center py-2 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors">
                      Edit
                    </Link>
                    {user.id !== currentUserId && (
                      <button
                        onClick={() => setConfirmUser({ user, action: user.isActive ? "deactivate" : "activate" })}
                        className={`flex-1 py-2 text-xs font-medium rounded-xl transition-colors ${
                          user.isActive ? "text-red-600 bg-red-50 hover:bg-red-100" : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                        }`}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={handlePage}
            />
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={!!confirmUser}
        onClose={() => setConfirmUser(null)}
        onConfirm={handleConfirm}
        title={confirmUser?.action === "deactivate" ? "Deactivate User" : "Activate User"}
        description={
          confirmUser?.action === "deactivate"
            ? `This will revoke ${confirmUser?.user.name ?? "this user"}'s access until reactivated.`
            : `This will restore ${confirmUser?.user.name ?? "this user"}'s access.`
        }
        confirmLabel={confirmUser?.action === "deactivate" ? "Deactivate" : "Activate"}
        variant={confirmUser?.action === "deactivate" ? "danger" : "warning"}
      />
    </>
  );
}
