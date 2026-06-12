import { Skeleton, TableSkeleton } from "@/components/shared/loading";

/**
 * Group-level fallback for every route under (dashboard) that doesn't define
 * its own loading.tsx. Paints instantly on navigation so the previous page
 * never sits frozen while the server fetches — the list/detail pages all share
 * this header + card-with-table shape closely enough.
 */
export default function DashboardSegmentLoading() {
  return (
    <div className="page-container">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="vault-card p-0 overflow-hidden">
        <div className="p-4 border-b border-arnifi-border">
          <Skeleton className="h-9 w-full sm:w-80" />
        </div>
        <TableSkeleton rows={6} cols={6} />
      </div>
    </div>
  );
}
