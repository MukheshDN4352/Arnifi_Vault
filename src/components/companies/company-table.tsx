"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Building2 } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import type { PaginatedResult, CompanyListItem } from "@/types";

export function CompanyTable({ result }: { result: PaginatedResult<CompanyListItem> }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
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

  const { data: companies, total, page, limit, totalPages } = result;

  return (
    <div className="vault-card p-0 overflow-hidden">
      <div className="p-4 border-b border-arnifi-border flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-arnifi-muted" />
          <input
            type="text"
            placeholder="Search companies…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              updateParams({ search: e.target.value });
            }}
            className="vault-input pl-10 h-9 text-sm"
          />
        </div>
        <Link
          href="/companies/new"
          className="btn-primary flex items-center gap-2 px-3.5 py-2 text-sm flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Company</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={search ? "No companies found" : "No companies yet"}
          description={
            search ? "Try a different search." : "Create your first company to own documents."
          }
          action={
            !search ? (
              <Link href="/companies/new" className="btn-primary text-sm px-4 py-2">
                Add Company
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full vault-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Clients</th>
                  <th>Documents</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-primary-600" />
                        </div>
                        <Link
                          href={`/companies/${c.id}`}
                          className="font-medium text-arnifi-ink hover:text-primary-700 hover:underline"
                        >
                          {c.name}
                        </Link>
                      </div>
                    </td>
                    <td className="text-arnifi-muted">{c._count.clients}</td>
                    <td className="text-arnifi-muted">{c._count.documents}</td>
                    <td className="text-xs text-arnifi-muted">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-arnifi-border">
            {companies.map((c) => (
              <Link
                key={c.id}
                href={`/companies/${c.id}`}
                className="p-4 flex items-center gap-3 hover:bg-arnifi-bg/60 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-primary-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-arnifi-ink truncate">{c.name}</p>
                  <p className="text-xs text-arnifi-muted">
                    {c._count.clients} clients · {c._count.documents} docs
                  </p>
                </div>
                <span className="text-xs text-arnifi-muted">{formatDate(c.createdAt)}</span>
              </Link>
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
  );
}
