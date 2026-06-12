import { Skeleton, CardSkeleton } from "@/components/shared/loading";

/**
 * Overview skeleton: mirrors the stat-card grid and the chart grid so the
 * dashboard reserves the same space it will fill, avoiding layout shift.
 */
export default function DashboardOverviewLoading() {
  return (
    <div className="page-container">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2">
          <div className="vault-card">
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
        <div className="lg:col-span-3">
          <div className="vault-card">
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
