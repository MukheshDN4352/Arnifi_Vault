"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, ShieldCheck, Filter } from "lucide-react";
import { formatDateTime } from "@/lib/utils/format";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { AUDIT_ACTION_LABELS } from "@/lib/constants";
import type { AuditLogWithActor } from "@/repositories/audit.repository";
import type { PaginatedResult } from "@/types";

const ACTION_COLORS: Record<string, string> = {
  LOGIN: "bg-blue-50 text-blue-700 border-blue-200",
  LOGOUT: "bg-gray-50 text-gray-600 border-gray-200",
  DOCUMENT_CREATED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DOCUMENT_UPDATED: "bg-amber-50 text-amber-700 border-amber-200",
  DOCUMENT_CHECKED_OUT: "bg-orange-50 text-orange-700 border-orange-200",
  COMPANY_CREATED: "bg-teal-50 text-teal-700 border-teal-200",
  CLIENT_CREATED: "bg-cyan-50 text-cyan-700 border-cyan-200",
  USER_CREATED: "bg-violet-50 text-violet-700 border-violet-200",
  USER_UPDATED: "bg-purple-50 text-purple-700 border-purple-200",
  USER_PASSWORD_RESET: "bg-amber-50 text-amber-700 border-amber-200",
  PASSWORD_RESET_SELF: "bg-amber-50 text-amber-700 border-amber-200",
  USER_DEACTIVATED: "bg-red-50 text-red-700 border-red-200",
  USER_ACTIVATED: "bg-green-50 text-green-700 border-green-200",
  REPORT_EXPORTED: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

interface AuditTableProps {
  result: PaginatedResult<AuditLogWithActor>;
}

export function AuditTable({ result }: AuditTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [actionFilter, setActionFilter] = useState(searchParams.get("action") ?? "");
  const [showFilters, setShowFilters] = useState(false);

  const updateParams = useCallback(
    (params: Record<string, string>) => {
      const current = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (value) current.set(key, value);
        else current.delete(key);
      });
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

  const { data: logs, total, page, limit, totalPages } = result;

  return (
    <div className="vault-card p-0 overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-arnifi-border flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-arnifi-muted" />
          <input
            type="text"
            placeholder="Search by user, entity ID…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              updateParams({ search: e.target.value });
            }}
            className="vault-input pl-10 h-9 text-sm"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors flex-shrink-0 ${
            actionFilter
              ? "bg-primary-50 text-primary-700 border-primary-200"
              : "bg-arnifi-bg text-arnifi-muted border-arnifi-border"
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>

      {showFilters && (
        <div className="px-4 py-3 bg-arnifi-bg border-b border-arnifi-border flex flex-wrap gap-3">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              updateParams({ action: e.target.value });
            }}
            className="vault-input w-auto min-w-[200px] h-9 text-sm"
          >
            <option value="">All Actions</option>
            {Object.entries(AUDIT_ACTION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <input
            type="date"
            onChange={(e) => updateParams({ dateFrom: e.target.value })}
            className="vault-input w-auto h-9 text-sm"
            placeholder="From date"
          />
          <input
            type="date"
            onChange={(e) => updateParams({ dateTo: e.target.value })}
            className="vault-input w-auto h-9 text-sm"
          />

          {actionFilter && (
            <button
              onClick={() => { setActionFilter(""); updateParams({ action: "" }); }}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Info banner: immutable records */}
      <div className="px-4 py-2.5 bg-arnifi-bg border-b border-arnifi-border flex items-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
        <p className="text-xs text-arnifi-muted">
          Audit records are <span className="font-semibold text-arnifi-ink">immutable</span> — they cannot be modified or deleted.
        </p>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No audit records found"
          description="System events will be recorded here as they occur."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full vault-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Entity Type</th>
                  <th>Entity ID</th>
                  <th>Performed By</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-xs text-arnifi-muted whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          ACTION_COLORS[log.action] ?? "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        {AUDIT_ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-arnifi-muted bg-arnifi-bg px-2 py-0.5 rounded-md border border-arnifi-border">
                        {log.entityType}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-[11px] text-arnifi-muted max-w-[100px] truncate block" title={log.entityId}>
                        {log.entityId.slice(0, 12)}…
                      </span>
                    </td>
                    <td>
                      {log.actorName || log.actorEmail ? (
                        <div>
                          <p className="text-xs font-medium text-arnifi-ink">
                            {log.actorName ?? "—"}
                          </p>
                          <p className="text-[11px] text-arnifi-muted">
                            {log.actorEmail ?? ""}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-arnifi-muted/50">System</span>
                      )}
                    </td>
                    <td>
                      {log.metadata ? (
                        <details className="text-[11px] text-arnifi-muted cursor-pointer">
                          <summary className="hover:text-arnifi-ink font-medium select-none">
                            View details
                          </summary>
                          <pre className="mt-1.5 p-2 bg-arnifi-bg rounded-lg text-[10px] overflow-auto max-h-32 max-w-xs border border-arnifi-border">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-arnifi-muted/50 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden divide-y divide-arnifi-border">
            {logs.map((log) => (
              <div key={log.id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    ACTION_COLORS[log.action] ?? "bg-gray-50 text-gray-600 border-gray-200"
                  }`}>
                    {AUDIT_ACTION_LABELS[log.action] ?? log.action}
                  </span>
                  <span className="text-[11px] text-arnifi-muted">
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-arnifi-muted">
                    {log.actorName ?? log.actorEmail ?? "System"}
                  </span>
                  <span className="font-mono text-arnifi-muted/60">
                    {log.entityType}
                  </span>
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
  );
}
