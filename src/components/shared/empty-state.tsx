import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-primary-400" />
      </div>
      <h3 className="text-sm font-semibold text-arnifi-ink mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-arnifi-muted max-w-xs leading-relaxed mb-4">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
