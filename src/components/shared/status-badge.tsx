import { cn } from "@/lib/utils/cn";
import { STATUS_COLORS } from "@/lib/constants";

type StatusKey = keyof typeof STATUS_COLORS;

interface StatusBadgeProps {
  status: StatusKey | string;
  size?: "sm" | "md";
  showDot?: boolean;
}

export function StatusBadge({ status, size = "md", showDot = true }: StatusBadgeProps) {
  const config = STATUS_COLORS[status as StatusKey] ?? {
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
    dot: "bg-gray-400",
    label: status,
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        config.bg,
        config.text,
        config.border,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      )}
    >
      {showDot && (
        <span
          className={cn("rounded-full flex-shrink-0", config.dot, size === "sm" ? "w-1.5 h-1.5" : "w-1.5 h-1.5")}
        />
      )}
      {config.label}
    </span>
  );
}
