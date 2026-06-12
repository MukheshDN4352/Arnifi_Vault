"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/shared/loading";

interface MonthlyData {
  month: string;
  checkouts: number;
}

// Lazy-load the recharts body: keeps recharts out of the dashboard's initial
// JS bundle. The skeleton reserves the chart's 200px height to avoid layout
// shift while the chunk loads.
const MonthlyActivityChartInner = dynamic(
  () => import("./monthly-activity-chart-inner"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[200px] w-full" />,
  }
);

export function MonthlyActivityChart({ data }: { data: MonthlyData[] }) {
  return (
    <div className="vault-card h-full">
      <h3 className="text-sm font-semibold text-arnifi-ink mb-1">
        Checkout Activity
      </h3>
      <p className="text-xs text-arnifi-muted mb-4">
        Documents removed over the last 6 months
      </p>

      {data.every((d) => d.checkouts === 0) ? (
        <div className="flex items-center justify-center h-40 text-arnifi-muted text-sm">
          No activity recorded yet
        </div>
      ) : (
        <MonthlyActivityChartInner data={data} />
      )}
    </div>
  );
}
