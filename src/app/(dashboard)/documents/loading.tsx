import { Skeleton, TableSkeleton } from "@/components/shared/loading";

/**
 * Documents skeleton: mirrors the header, the search/filter toolbar, and the
 * documents table (Code · Name · Owner · Category · Location · Status · File).
 */
export default function DocumentsLoading() {
  return (
    <div className="page-container">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36 flex-shrink-0" />
      </div>

      <div className="vault-card p-0 overflow-hidden">
        <div className="p-4 border-b border-arnifi-border flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-24 flex-shrink-0" />
        </div>
        <TableSkeleton rows={8} cols={7} />
      </div>
    </div>
  );
}
