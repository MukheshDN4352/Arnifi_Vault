"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import Link from "next/link";
import { Search, Filter, ClipboardList, Download } from "lucide-react";
import { formatDateTime } from "@/lib/utils/format";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import type { PaginatedResult } from "@/types";
import type { CheckoutLogWithPerformer } from "@/repositories/checkout.repository";

interface Props {
  result: PaginatedResult<CheckoutLogWithPerformer>;
}

export function CheckoutHistoryTable({ result }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [showFilters, setShowFilters] = useState(false);

  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";

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

  const owner = (log: CheckoutLogWithPerformer) =>
    log.ownerClient ?? log.ownerCompany ?? "—";

  const { data: logs, total, page, limit, totalPages } = result;

  return (
    <div className="vault-card p-0 overflow-hidden">
      <div className="p-4 border-b border-arnifi-border flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-arnifi-muted" />
          <input
            type="text"
            placeholder="Search by document, code, or taker…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="vault-input pl-10 h-9 text-sm"
          />
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors ${
              showFilters || dateFrom || dateTo
                ? "bg-primary-50 text-primary-700 border-primary-200"
                : "bg-arnifi-bg text-arnifi-muted border-arnifi-border"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
          </button>
          <Link
            href="/reports"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border border-arnifi-border text-arnifi-muted hover:bg-primary-50 hover:text-primary-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Link>
        </div>
      </div>

      {showFilters && (
        <div className="px-4 py-3 bg-arnifi-bg border-b border-arnifi-border flex flex-wrap items-center gap-3">
          <label className="text-xs text-arnifi-muted">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => updateParams({ dateFrom: e.target.value })}
            className="vault-input w-auto h-9 text-sm"
          />
          <label className="text-xs text-arnifi-muted">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => updateParams({ dateTo: e.target.value })}
            className="vault-input w-auto h-9 text-sm"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => updateParams({ dateFrom: "", dateTo: "" })}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {logs.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No checkouts yet"
          description="When documents are checked out, they appear here as an immutable record."
        />
      ) : (
        <>
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full vault-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Owner</th>
                  <th>Taken By</th>
                  <th>Purpose</th>
                  <th>Checked Out</th>
                  <th>Issued By</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <p className="font-medium text-arnifi-ink">{log.docName}</p>
                      <span className="font-mono text-[11px] text-arnifi-muted">{log.docCode}</span>
                    </td>
                    <td className="text-sm text-arnifi-muted">{owner(log)}</td>
                    <td>
                      <p className="text-sm text-arnifi-ink">{log.takenByName}</p>
                      {log.takenByDetail && (
                        <p className="text-[11px] text-arnifi-muted">{log.takenByDetail}</p>
                      )}
                    </td>
                    <td className="text-xs text-arnifi-muted max-w-[220px] truncate" title={log.purpose ?? ""}>
                      {log.purpose ?? "—"}
                    </td>
                    <td className="text-xs text-arnifi-muted whitespace-nowrap">
                      {formatDateTime(log.checkedOutAt)}
                    </td>
                    <td className="text-xs text-arnifi-muted">{log.performerName ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden divide-y divide-arnifi-border">
            {logs.map((log) => (
              <div key={log.id} className="p-4 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-arnifi-ink">{log.docName}</p>
                  <span className="font-mono text-[11px] text-arnifi-muted">{log.docCode}</span>
                </div>
                <p className="text-xs text-arnifi-muted">
                  Taken by <span className="text-arnifi-ink font-medium">{log.takenByName}</span>
                  {" · "}
                  {owner(log)}
                </p>
                <p className="text-[11px] text-arnifi-muted">
                  {formatDateTime(log.checkedOutAt)} · by {log.performerName ?? "—"}
                </p>
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
  );
}
