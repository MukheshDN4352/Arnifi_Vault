import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import type { SessionUser } from "@/types";
import type { Role } from "@prisma/client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user: SessionUser = {
    id: session.user.id,
    name: session.user.name ?? "User",
    email: session.user.email ?? "",
    role: session.user.role as Role,
    mustResetPassword: session.user.mustResetPassword ?? false,
    companyId: session.user.companyId ?? null,
    clientId: session.user.clientId ?? null,
  };

  return (
    <div className="min-h-screen bg-arnifi-bg">
      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen transition-all duration-200">
        {/* Top navbar */}
        <Navbar user={user} />

        {/* Page content */}
        <main className="flex-1 page-transition">
          {children}
        </main>
      </div>
    </div>
  );
}
