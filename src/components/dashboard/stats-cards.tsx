import { FileText, CheckCircle, Archive, ClipboardList, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Stat {
  label: string;
  value: number;
  icon: React.ElementType;
  gradient: string;
  iconColor: string;
  description?: string;
}

function StatCard({ label, value, icon: Icon, gradient, iconColor, description }: Stat) {
  return (
    <div className="stat-card group hover:shadow-card-hover transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", gradient)}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-arnifi-ink tracking-tight">
          {value.toLocaleString()}
        </p>
        <p className="text-sm font-medium text-arnifi-ink mt-1">{label}</p>
        {description && <p className="text-xs text-arnifi-muted mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

interface DashboardStatsProps {
  totalDocuments: number;
  availableDocuments: number;
  checkedOutDocuments: number;
  // Admin-only extras
  totalCheckouts?: number;
  totalUsers?: number;
}

export function DashboardStats({
  totalDocuments,
  availableDocuments,
  checkedOutDocuments,
  totalCheckouts,
  totalUsers,
}: DashboardStatsProps) {
  const stats: Stat[] = [
    {
      label: "Total Documents",
      value: totalDocuments,
      icon: FileText,
      gradient: "bg-gradient-to-br from-primary-50 to-primary-100",
      iconColor: "text-primary-600",
      description: "Registered in vault",
    },
    {
      label: "Available",
      value: availableDocuments,
      icon: CheckCircle,
      gradient: "bg-gradient-to-br from-emerald-50 to-emerald-100",
      iconColor: "text-emerald-600",
      description: "In the active vault",
    },
    {
      label: "Checked Out",
      value: checkedOutDocuments,
      icon: Archive,
      gradient: "bg-gradient-to-br from-amber-50 to-amber-100",
      iconColor: "text-amber-600",
      description: "Removed from vault",
    },
    ...(totalCheckouts !== undefined
      ? [
          {
            label: "Total Checkouts",
            value: totalCheckouts,
            icon: ClipboardList,
            gradient: "bg-gradient-to-br from-orange-50 to-orange-100",
            iconColor: "text-orange-600",
            description: "All-time removals",
          } as Stat,
        ]
      : []),
    ...(totalUsers !== undefined
      ? [
          {
            label: "Total Users",
            value: totalUsers,
            icon: Users,
            gradient: "bg-gradient-to-br from-violet-50 to-violet-100",
            iconColor: "text-violet-600",
            description: "Login accounts",
          } as Stat,
        ]
      : []),
  ];

  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6",
        stats.length >= 5 ? "lg:grid-cols-5" : "lg:grid-cols-4"
      )}
    >
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}
