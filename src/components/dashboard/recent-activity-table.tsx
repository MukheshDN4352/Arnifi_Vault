import Link from "next/link";
import { Activity, ArrowRight, ArrowUpRight } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/format";
import { EmptyState } from "@/components/shared/empty-state";
import type { CheckoutLogWithPerformer } from "@/repositories/checkout.repository";

export function RecentActivityTable({ logs }: { logs: CheckoutLogWithPerformer[] }) {
  return (
    <div className="vault-card flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-arnifi-ink">Recent Checkouts</h3>
          <p className="text-xs text-arnifi-muted mt-0.5">Latest documents removed from the vault</p>
        </div>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No checkouts yet"
          description="Document checkouts will appear here."
        />
      ) : (
        <div className="space-y-0 flex-1 -mx-1">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-arnifi-bg transition-colors"
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-50 text-amber-600">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-arnifi-ink truncate">{log.docName}</p>
                <p className="text-[11px] text-arnifi-muted truncate">
                  Taken by {log.takenByName}
                  {log.ownerClient || log.ownerCompany
                    ? ` · ${log.ownerClient ?? log.ownerCompany}`
                    : ""}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] text-arnifi-muted">{formatRelativeTime(log.checkedOutAt)}</p>
                <p className="text-[10px] text-arnifi-muted/70">{log.performerName ?? "—"}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/checkout-history"
        className="flex items-center justify-center gap-1.5 mt-4 pt-3 border-t border-arnifi-border text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
      >
        View checkout history
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
