"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/shared/loading";

// Lazy-load the recharts body: keeps recharts out of the dashboard's initial
// JS bundle. The skeleton reserves the chart's 200px height to avoid layout
// shift while the chunk loads.
const DocumentStatusChartInner = dynamic(
  () => import("./document-status-chart-inner"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[200px] w-full" />,
  }
);

interface Props {
  available: number;
  checkedOut: number;
}

export function DocumentStatusChart({ available, checkedOut }: Props) {
  const data = [
    { name: "Available", value: available },
    { name: "Checked Out", value: checkedOut },
  ].filter((d) => d.value > 0);

  const total = available + checkedOut;

  return (
    <div className="vault-card h-full">
      <h3 className="text-sm font-semibold text-arnifi-ink mb-1">
        Document Status
      </h3>
      <p className="text-xs text-arnifi-muted mb-4">
        Distribution across {total} documents
      </p>

      {total === 0 ? (
        <div className="flex items-center justify-center h-40 text-arnifi-muted text-sm">
          No documents yet
        </div>
      ) : (
        <DocumentStatusChartInner data={data} />
      )}
    </div>
  );
}
