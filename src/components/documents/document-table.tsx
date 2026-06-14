"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Search,
  Plus,
  Edit,
  FileText,
  Filter,
  ExternalLink,
  ClipboardCheck,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { CheckoutDialog, type CheckoutTarget } from "@/components/documents/checkout-dialog";
import { SearchableSelect } from "@/components/shared/searchable-select";
import {
  VAULT_LOCATIONS,
  type VaultLocationKey,
  getLocationOptions,
  getLockerOptions,
  getLockerLabel,
  getRackLabel,
} from "@/lib/config/vault-locations";
import type { PaginatedResult, DocumentWithOwner } from "@/types";

interface DocumentTableProps {
  result: PaginatedResult<DocumentWithOwner>;
  isAdmin: boolean;
}

function ownerName(doc: DocumentWithOwner): string {
  if (doc.client) return doc.client.name;
  if (doc.company) return doc.company.name;
  return "—";
}
function ownerKind(doc: DocumentWithOwner): string {
  if (doc.client) return "Client";
  if (doc.company) return "Company";
  return "";
}
function locationName(doc: DocumentWithOwner): string {
  if (!doc.location) return "—";
  return VAULT_LOCATIONS[doc.location as VaultLocationKey]?.label ?? doc.location;
}
// Friendly "Locker 1 · Top Rack" from the stored locker/rack values.
function lockerRackLabel(doc: DocumentWithOwner): string {
  if (!doc.location) return "";
  const parts: string[] = [];
  if (doc.lockerNo) parts.push(getLockerLabel(doc.location, doc.lockerNo));
  if (doc.rackNo) parts.push(getRackLabel(doc.location, doc.lockerNo, doc.rackNo));
  return parts.join(" · ");
}

export function DocumentTable({
  result,
  isAdmin,
}: DocumentTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [showFilters, setShowFilters] = useState(false);
  const [checkoutTarget, setCheckoutTarget] = useState<CheckoutTarget | null>(null);

  // Default view is AVAILABLE only; "ALL" clears the status filter.
  const statusValue = searchParams.get("status") ?? "AVAILABLE";
  const locationValue = searchParams.get("location") ?? "";
  const lockerValue = searchParams.get("lockerNo") ?? "";

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

  const hasActiveFilters =
    statusValue !== "AVAILABLE" || locationValue || lockerValue;

  const { data: documents, total, page, limit, totalPages } = result;

  return (
    <>
      <div className="vault-card p-0 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-arnifi-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-arnifi-muted" />
            <input
              type="text"
              placeholder="Search documents, codes, owners…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="vault-input pl-10 h-9 text-sm"
            />
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors ${
                showFilters || hasActiveFilters
                  ? "bg-primary-50 text-primary-700 border-primary-200"
                  : "bg-arnifi-bg text-arnifi-muted border-arnifi-border hover:bg-primary-50/50"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
            </button>
            {isAdmin && (
              <Link href="/documents/new" className="btn-primary flex items-center gap-2 px-3.5 py-2 text-sm">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Document</span>
                <span className="sm:hidden">New</span>
              </Link>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="px-4 py-3 bg-arnifi-bg border-b border-arnifi-border flex flex-wrap gap-3">
            <SearchableSelect
              className="w-44"
              value={statusValue}
              onChange={(v) => updateParams({ status: v })}
              options={[
                { value: "AVAILABLE", label: "Available" },
                { value: "CHECKED_OUT", label: "Checked Out (removed)" },
                { value: "ALL", label: "All Statuses" },
              ]}
            />

            {/* Storage location filters (available to all roles) */}
            <SearchableSelect
              className="w-40"
              value={locationValue}
              onChange={(v) => updateParams({ location: v, lockerNo: "" })}
              options={[
                { value: "", label: "All Locations" },
                ...getLocationOptions(),
              ]}
            />
            <SearchableSelect
              className="w-36"
              value={lockerValue}
              onChange={(v) => updateParams({ lockerNo: v })}
              disabled={!locationValue}
              disabledHint="Locker"
              options={[
                { value: "", label: "All Lockers" },
                ...getLockerOptions(locationValue),
              ]}
            />

            {hasActiveFilters && (
              <button
                onClick={() =>
                  updateParams({
                    status: "",
                    location: "",
                    lockerNo: "",
                  })
                }
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {documents.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents found"
            description={
              isAdmin
                ? "Try adjusting filters, or add a document."
                : "No documents match your access or filters."
            }
            action={
              isAdmin ? (
                <Link href="/documents/new" className="btn-primary text-sm px-4 py-2">
                  Add Document
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full vault-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Owner</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>File</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <span className="font-mono text-xs text-arnifi-muted bg-arnifi-bg px-2 py-1 rounded-lg">
                          {doc.code}
                        </span>
                      </td>
                      <td><p className="font-medium text-arnifi-ink">{doc.name}</p></td>
                      <td>
                        <p className="text-arnifi-ink text-sm">{ownerName(doc)}</p>
                        <p className="text-[11px] text-arnifi-muted">{ownerKind(doc)}</p>
                      </td>
                      <td className="text-xs text-arnifi-muted">
                        {doc.location ? (
                          <div className="flex flex-col leading-tight">
                            <span className="font-medium text-arnifi-ink">{locationName(doc)}</span>
                            {lockerRackLabel(doc) && <span>{lockerRackLabel(doc)}</span>}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td><StatusBadge status={doc.status} /></td>
                      <td>
                        {doc.fileUrl ? (
                          <a href={`/api/files/view?id=${doc.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-xs font-medium">
                            <ExternalLink className="w-3 h-3" /> View
                          </a>
                        ) : (
                          <span className="text-arnifi-muted/50 text-xs">—</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td>
                          <div className="flex items-center gap-2">
                            {doc.status === "AVAILABLE" && (
                              <button
                                onClick={() =>
                                  setCheckoutTarget({
                                    id: doc.id,
                                    code: doc.code,
                                    name: doc.name,
                                    ownerLabel: `${ownerName(doc)}${ownerKind(doc) ? ` (${ownerKind(doc)})` : ""}`,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                              >
                                <ClipboardCheck className="w-3 h-3" /> Checkout
                              </button>
                            )}
                            <Link
                              href={`/documents/${doc.id}/edit`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-arnifi-muted hover:bg-primary-50 hover:text-primary-700 border border-arnifi-border transition-colors"
                            >
                              <Edit className="w-3 h-3" /> Edit
                            </Link>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-arnifi-border">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-arnifi-ink truncate">{doc.name}</p>
                      <p className="text-xs text-arnifi-muted mt-0.5">
                        {ownerName(doc)}
                      </p>
                    </div>
                    <StatusBadge status={doc.status} size="sm" />
                  </div>
                  <p className="text-[11px] text-arnifi-muted">
                    {locationName(doc)}
                    {lockerRackLabel(doc) ? ` · ${lockerRackLabel(doc)}` : ""}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-arnifi-muted bg-arnifi-bg px-2 py-0.5 rounded-md border border-arnifi-border">
                      {doc.code}
                    </span>
                    {isAdmin && (
                      <div className="flex items-center gap-3">
                        {doc.status === "AVAILABLE" && (
                          <button
                            onClick={() =>
                              setCheckoutTarget({
                                id: doc.id,
                                code: doc.code,
                                name: doc.name,
                                ownerLabel: `${ownerName(doc)}${ownerKind(doc) ? ` (${ownerKind(doc)})` : ""}`,
                              })
                            }
                            className="text-xs font-medium text-amber-700"
                          >
                            Checkout
                          </button>
                        )}
                        <Link href={`/documents/${doc.id}/edit`} className="text-xs font-medium text-primary-600">
                          Edit
                        </Link>
                      </div>
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

      <CheckoutDialog target={checkoutTarget} onClose={() => setCheckoutTarget(null)} />
    </>
  );
}
