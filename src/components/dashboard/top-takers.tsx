import { Users, Trophy } from "lucide-react";

interface Props {
  takers: { name: string; count: number }[];
}

export function TopTakers({ takers }: Props) {
  return (
    <div className="vault-card h-full">
      <div className="flex items-center gap-2 mb-1">
        <Trophy className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-arnifi-ink">Top Takers</h3>
      </div>
      <p className="text-xs text-arnifi-muted mb-4">Who removes documents most often</p>

      {takers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-arnifi-muted text-sm gap-2">
          <Users className="w-5 h-5 opacity-50" />
          No checkouts yet
        </div>
      ) : (
        <div className="space-y-1">
          {takers.map((t, i) => (
            <div
              key={t.name}
              className="flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-arnifi-bg transition-colors"
            >
              <span className="w-6 h-6 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <span className="flex-1 text-sm text-arnifi-ink truncate">{t.name}</span>
              <span className="text-xs font-medium text-arnifi-muted">
                {t.count} {t.count === 1 ? "checkout" : "checkouts"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
