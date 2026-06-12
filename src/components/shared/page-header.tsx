interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  badge?: string;
}

export function PageHeader({ title, description, actions, badge }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-arnifi-ink tracking-tight">{title}</h1>
          {badge && (
            <span className="px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full border border-primary-100">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-sm text-arnifi-muted">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>
      )}
    </div>
  );
}
