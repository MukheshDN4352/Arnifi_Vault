"use client";

import { usePathname } from "next/navigation";
import { Bell, ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getInitials } from "@/lib/utils/format";
import type { SessionUser } from "@/types";

interface NavbarProps {
  user: SessionUser;
}

const PAGE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  documents: "Documents",
  "checkout-history": "Checkout History",
  companies: "Companies",
  clients: "Clients",
  users: "Users",
  "audit-trail": "Audit Trail",
  reports: "Reports",
  new: "New",
  edit: "Edit",
};

function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      <Home className="w-3.5 h-3.5 text-arnifi-muted" />
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        const label = PAGE_LABELS[segment] ?? segment;
        // Skip dynamic segments that look like IDs
        const isId = segment.length > 20 || /^[a-z0-9]{20,}$/.test(segment);
        if (isId) return null;

        return (
          <span key={segment} className="flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3 text-arnifi-muted/50" />
            <span
              className={cn(
                "font-medium",
                isLast ? "text-arnifi-ink" : "text-arnifi-muted"
              )}
            >
              {label}
            </span>
          </span>
        );
      })}
    </nav>
  );
}

export function Navbar({ user }: NavbarProps) {
  return (
    <header className="h-14 bg-white border-b border-arnifi-border flex items-center justify-between pl-16 pr-4 sm:px-4 lg:px-6 sticky top-0 z-20">
      {/* Breadcrumb — hidden on small screens for space */}
      <div className="hidden sm:block">
        <Breadcrumb />
      </div>

      {/* Mobile: page title */}
      <div className="sm:hidden">
        <p className="text-sm font-semibold text-arnifi-ink">Arnifi Vault</p>
      </div>

      {/* Right: user info */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Role badge */}
        <span
          className={cn(
            "hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider",
            user.role === "ADMIN"
              ? "bg-primary-50 text-primary-700"
              : "bg-arnifi-bg text-arnifi-muted"
          )}
        >
          {user.role}
        </span>

        {/* User avatar */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-semibold">
            {getInitials(user.name ?? user.email)}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-arnifi-ink leading-tight">
              {user.name ?? user.email}
            </p>
            <p className="text-[10px] text-arnifi-muted">{user.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
