"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import Link from "next/link";
import { Search, Plus, UserSquare2 } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import type { PaginatedResult, ClientListItem } from "@/types";

export function ClientTable({ result }: { result: PaginatedResult<ClientListItem> }) {
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

  // Debounce search: push the URL (which refetches on the server) only after
  // the user pauses typing, instead of firing a round-trip on every keystroke.
  const debouncedSearch = useDebounce(search, 350);
  useEffect(() => {
    if (debouncedSearch !== (searchParams.get("search") ?? "")) {
      updateParams({ search: debouncedSearch });
    }
  }, [debouncedSearch, searchParams, updateParams]);

  const handlePage = (page: number) => {
    const current = new URLSearchParams(searchParams.toString());
    current.set("page", String(page));
    startTransition(() => router.push(`${pathname}?${current.toString()}`));
  };

  const { data: clients, total, page, limit, totalPages } = result;

  return (
    <div className="vault-card p-0 overflow-hidden">
      <div className="p-4 border-b border-arnifi-border flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-arnifi-muted" />
          <input
            type="text"
            placeholder="Search clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="vault-input pl-10 h-9 text-sm"
          />
        </div>
        <Link
          href="/clients/new"
          className="btn-primary flex items-center gap-2 px-3.5 py-2 text-sm flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Client</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {clients.length === 0 ? (
        <EmptyState
          icon={UserSquare2}
          title={search ? "No clients found" : "No clients yet"}
          description={
            search ? "Try a different search." : "Create clients to own documents (optionally under a company)."
          }
          action={
            !search ? (
              <Link href="/clients/new" className="btn-primary text-sm px-4 py-2">
                Add Client
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
                  <th>Client</th>
                  <th>Company</th>
                  <th>Documents</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                          <UserSquare2 className="w-4 h-4 text-primary-600" />
                        </div>
                        <Link
                          href={`/clients/${c.id}`}
                          className="font-medium text-arnifi-ink hover:text-primary-700 hover:underline"
                        >
                          {c.name}
                        </Link>
                      </div>
                    </td>
                    <td className="text-arnifi-muted">
                      {c.company ? (
                        c.company.name
                      ) : (
                        <span className="text-arnifi-muted/60">Individual</span>
                      )}
                    </td>
                    <td className="text-arnifi-muted">{c._count.documents}</td>
                    <td className="text-xs text-arnifi-muted">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-arnifi-border">
            {clients.map((c) => (
              <Link
                key={c.id}
                href={`/clients/${c.id}`}
                className="p-4 flex items-center gap-3 hover:bg-arnifi-bg/60 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <UserSquare2 className="w-4 h-4 text-primary-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-arnifi-ink truncate">{c.name}</p>
                  <p className="text-xs text-arnifi-muted truncate">
                    {c.company ? c.company.name : "Individual"} · {c._count.documents} docs
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
