import Link from "next/link";
import { FileText } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  VAULT_LOCATIONS,
  type VaultLocationKey,
  getLockerLabel,
  getRackLabel,
} from "@/lib/config/vault-locations";
import type { DocumentWithOwner } from "@/types";

interface DocumentsListProps {
  documents: DocumentWithOwner[];
  /** Show the owner column (useful on a company page mixing company + client docs). */
  showOwner?: boolean;
  /** Admins link through to the document edit page; non-admins (employees) get
   *  a view-only file link, since the edit route is admin-gated. */
  isAdmin?: boolean;
  emptyText?: string;
}

function ownerLabel(doc: DocumentWithOwner): string {
  if (doc.client) return `${doc.client.name} (Client)`;
  if (doc.company) return `${doc.company.name} (Company)`;
  return "—";
}
function categoryLabel(doc: DocumentWithOwner): string {
  return doc.category === "Other" && doc.categoryOther ? doc.categoryOther : doc.category;
}
function locationLabel(doc: DocumentWithOwner): string {
  if (!doc.location) return "—";
  const loc = VAULT_LOCATIONS[doc.location as VaultLocationKey]?.label ?? doc.location;
  const parts: string[] = [loc];
  if (doc.lockerNo) parts.push(getLockerLabel(doc.location, doc.lockerNo));
  if (doc.rackNo) parts.push(getRackLabel(doc.location, doc.lockerNo, doc.rackNo));
  return parts.join(" · ");
}

export function DocumentsList({
  documents,
  showOwner = false,
  isAdmin = false,
  emptyText = "No documents yet.",
}: DocumentsListProps) {
  if (documents.length === 0) {
    return (
      <div className="vault-card flex flex-col items-center justify-center py-12 text-center">
        <div className="w-10 h-10 rounded-full bg-arnifi-bg flex items-center justify-center mb-3">
          <FileText className="w-5 h-5 text-arnifi-muted" />
        </div>
        <p className="text-sm font-medium text-arnifi-ink">No documents</p>
        <p className="text-xs text-arnifi-muted mt-1">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="vault-card p-0 overflow-hidden">
      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full vault-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              {showOwner && <th>Owner</th>}
              <th>Category</th>
              <th>Location</th>
              <th>Status</th>
              <th></th>
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
                {showOwner && (
                  <td className="text-xs text-arnifi-muted">{ownerLabel(doc)}</td>
                )}
                <td>
                  <span className="px-2 py-0.5 bg-arnifi-bg rounded-md text-xs text-arnifi-muted border border-arnifi-border">
                    {categoryLabel(doc)}
                  </span>
                </td>
                <td className="text-xs text-arnifi-muted whitespace-nowrap">{locationLabel(doc)}</td>
                <td><StatusBadge status={doc.status} /></td>
                <td>
                  {isAdmin ? (
                    <Link
                      href={`/documents/${doc.id}/edit`}
                      className="text-xs font-medium text-primary-600 hover:text-primary-700"
                    >
                      View
                    </Link>
                  ) : doc.fileUrl ? (
                    <a
                      href={`/api/files/view?id=${doc.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-primary-600 hover:text-primary-700"
                    >
                      View file
                    </a>
                  ) : (
                    <span className="text-arnifi-muted/50 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden divide-y divide-arnifi-border">
        {documents.map((doc) => {
          const inner = (
            <>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-arnifi-ink truncate">{doc.name}</p>
                <StatusBadge status={doc.status} size="sm" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-arnifi-muted bg-arnifi-bg px-2 py-0.5 rounded-md border border-arnifi-border">
                  {doc.code}
                </span>
                <span className="text-xs text-arnifi-muted">{categoryLabel(doc)}</span>
                {showOwner && <span className="text-xs text-arnifi-muted">· {ownerLabel(doc)}</span>}
                {!isAdmin && doc.fileUrl && (
                  <a
                    href={`/api/files/view?id=${doc.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-primary-600"
                  >
                    View file
                  </a>
                )}
              </div>
            </>
          );
          return isAdmin ? (
            <Link
              key={doc.id}
              href={`/documents/${doc.id}/edit`}
              className="block p-4 space-y-2 hover:bg-arnifi-bg/60 transition-colors"
            >
              {inner}
            </Link>
          ) : (
            <div key={doc.id} className="p-4 space-y-2">
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
