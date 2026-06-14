"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Users,
  Building2,
  UserSquare2,
  ShieldCheck,
  BarChart3,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getInitials } from "@/lib/utils/format";
import type { SessionUser } from "@/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  // Visible to staff (ADMIN + EMPLOYEE) but not CLIENT. View-only sections.
  staff?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Checkout History", href: "/checkout-history", icon: ClipboardList, adminOnly: true },
  { label: "Companies", href: "/companies", icon: Building2, staff: true },
  { label: "Clients", href: "/clients", icon: UserSquare2, staff: true },
  { label: "Users", href: "/users", icon: Users, adminOnly: true },
  { label: "Audit Trail", href: "/audit-trail", icon: ShieldCheck, adminOnly: true },
  { label: "Reports", href: "/reports", icon: BarChart3, adminOnly: true },
];

interface SidebarProps {
  user: SessionUser;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user.role === "ADMIN";
  const isStaff = user.role === "ADMIN" || user.role === "EMPLOYEE";

  const filteredNav = NAV_ITEMS.filter((item) => {
    if (item.adminOnly) return isAdmin;
    if (item.staff) return isStaff;
    return true;
  });

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn("flex flex-col h-full", mobile ? "w-72" : collapsed ? "w-16" : "w-64")}>
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-5 border-b border-arnifi-border",
        collapsed && !mobile && "justify-center px-2"
      )}>
        <div className="w-8 h-8 bg-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        {(!collapsed || mobile) && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-arnifi-ink leading-tight">
              Arnifi Vault
            </p>
            <p className="text-[10px] text-arnifi-muted font-medium tracking-wide uppercase">
              Document Logbook
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => mobile && setMobileOpen(false)}
              className={cn(
                "sidebar-item",
                active && "active",
                collapsed && !mobile && "justify-center px-2"
              )}
              title={collapsed && !mobile ? item.label : undefined}
            >
              <Icon className={cn("w-4.5 h-4.5 flex-shrink-0", active ? "text-primary-600" : "text-arnifi-muted")} />
              {(!collapsed || mobile) && (
                <span className={active ? "text-primary-700" : ""}>{item.label}</span>
              )}
              {active && (!collapsed || mobile) && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-arnifi-border p-3 space-y-1">
        {/* User card */}
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-xl",
          collapsed && !mobile && "justify-center"
        )}>
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {getInitials(user.name ?? user.email)}
          </div>
          {(!collapsed || mobile) && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-arnifi-ink truncate">{user.name ?? user.email}</p>
              <p className="text-[10px] text-arnifi-muted truncate">{user.role}</p>
            </div>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-arnifi-muted hover:bg-red-50 hover:text-red-600 transition-all duration-150",
            collapsed && !mobile && "justify-center px-2"
          )}
          title={collapsed && !mobile ? "Sign out" : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {(!collapsed || mobile) && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col bg-white border-r border-arnifi-border shadow-sidebar fixed top-0 left-0 h-full z-30 transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}>
        <SidebarContent />

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3.5 top-6 w-7 h-7 bg-white border border-arnifi-border rounded-full flex items-center justify-center shadow-card hover:bg-primary-50 hover:border-primary-200 transition-all z-10"
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-arnifi-muted" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-arnifi-muted" />
          )}
        </button>
      </aside>

      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
        className="lg:hidden fixed top-2.5 left-3 z-40 w-9 h-9 bg-white border border-arnifi-border rounded-xl shadow-card flex items-center justify-center"
      >
        <Menu className="w-4.5 h-4.5 text-arnifi-ink" />
      </button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="w-72 bg-white h-full shadow-2xl animate-slide-in flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-arnifi-border flex-shrink-0">
              <span className="text-sm font-semibold text-arnifi-ink">Navigation</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-arnifi-bg transition-colors"
              >
                <X className="w-4 h-4 text-arnifi-muted" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <SidebarContent mobile />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
