import { MapPin } from "lucide-react";
import { VAULT_LOCATIONS, type VaultLocationKey } from "@/lib/config/vault-locations";
import type { VaultLocation } from "@prisma/client";

interface Props {
  data: { location: VaultLocation | null; count: number }[];
}

const BAR_COLORS = ["bg-primary-500", "bg-emerald-500", "bg-amber-500", "bg-violet-500"];

export function LocationBreakdown({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const sorted = [...data].sort((a, b) => b.count - a.count);

  return (
    <div className="vault-card h-full">
      <div className="flex items-center gap-2 mb-1">
        <MapPin className="w-4 h-4 text-primary-600" />
        <h3 className="text-sm font-semibold text-arnifi-ink">By Location</h3>
      </div>
      <p className="text-xs text-arnifi-muted mb-4">Documents per storage location</p>

      {total === 0 ? (
        <div className="flex items-center justify-center h-32 text-arnifi-muted text-sm">
          No documents yet
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((d, i) => {
            const label = d.location
              ? VAULT_LOCATIONS[d.location as VaultLocationKey]?.label ?? d.location
              : "Unassigned";
            const pct = total ? Math.round((d.count / total) * 100) : 0;
            return (
              <div key={label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-arnifi-ink">{label}</span>
                  <span className="text-arnifi-muted">
                    {d.count} · {pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-arnifi-bg overflow-hidden">
                  <div
                    className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
