import { Suspense, cache } from "react";
import { auth } from "@/lib/auth/auth";
import { documentRepository } from "@/repositories/document.repository";
import { userRepository } from "@/repositories/user.repository";
import { checkoutRepository } from "@/repositories/checkout.repository";
import { documentScopeForUser } from "@/lib/db/scopes";
import { PageHeader } from "@/components/shared/page-header";
import { DashboardStats } from "@/components/dashboard/stats-cards";
import { DocumentStatusChart } from "@/components/dashboard/document-status-chart";
import { MonthlyActivityChart } from "@/components/dashboard/monthly-activity-chart";
import { LocationBreakdown } from "@/components/dashboard/location-breakdown";
import { TopTakers } from "@/components/dashboard/top-takers";
import { RecentActivityTable } from "@/components/dashboard/recent-activity-table";
import { CardSkeleton } from "@/components/shared/loading";
import type { Prisma } from "@prisma/client";

type Scope = Prisma.DocumentWhereInput | undefined;

// Deduplicate document stats within a single render: StatsSection and
// ChartsSection both need them and are passed the same `scope` reference, so
// React's request-scoped cache collapses the two identical calls into one DB
// round-trip (3 count queries instead of 6) while keeping the Suspense
// boundaries independent.
const getDocStats = cache((scope: Scope) => documentRepository.getStats(scope));

async function StatsSection({ scope, isAdmin }: { scope: Scope; isAdmin: boolean }) {
  const [docStats, userStats, checkoutStats] = await Promise.all([
    getDocStats(scope),
    isAdmin ? userRepository.getCount() : Promise.resolve(null),
    isAdmin ? checkoutRepository.getStats() : Promise.resolve(null),
  ]);

  return (
    <DashboardStats
      totalDocuments={docStats.total}
      availableDocuments={docStats.available}
      checkedOutDocuments={docStats.checkedOut}
      totalCheckouts={checkoutStats?.totalCheckouts}
      totalUsers={userStats?.total}
    />
  );
}

async function ChartsSection({ scope, isAdmin }: { scope: Scope; isAdmin: boolean }) {
  const [docStats, locations, monthly] = await Promise.all([
    getDocStats(scope),
    documentRepository.getLocationBreakdown(scope),
    isAdmin ? checkoutRepository.getMonthlyActivity(6) : Promise.resolve(null),
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      <div className="lg:col-span-2">
        <DocumentStatusChart available={docStats.available} checkedOut={docStats.checkedOut} />
      </div>
      <div className="lg:col-span-3">
        {monthly ? (
          <MonthlyActivityChart data={monthly} />
        ) : (
          <LocationBreakdown data={locations} />
        )}
      </div>
      {monthly && (
        <div className="lg:col-span-5">
          <LocationBreakdown data={locations} />
        </div>
      )}
    </div>
  );
}

async function AdminActivitySection() {
  const [recent, takers] = await Promise.all([
    checkoutRepository.getRecentCheckouts(8),
    checkoutRepository.getTopTakers(5),
  ]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <RecentActivityTable logs={recent} />
      <TopTakers takers={takers} />
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const scope = session?.user
    ? documentScopeForUser({
        role: session.user.role,
        companyId: session.user.companyId,
        clientId: session.user.clientId,
      })
    : undefined;

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="page-container">
      <PageHeader
        title={`${greeting}, ${firstName}`}
        description="Here's what's happening in the vault today."
      />

      <Suspense
        fallback={
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {Array.from({ length: isAdmin ? 5 : 3 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <StatsSection scope={scope} isAdmin={isAdmin} />
      </Suspense>

      <div className="mb-5">
        <Suspense
          fallback={
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              <div className="lg:col-span-2"><CardSkeleton /></div>
              <div className="lg:col-span-3"><CardSkeleton /></div>
            </div>
          }
        >
          <ChartsSection scope={scope} isAdmin={isAdmin} />
        </Suspense>
      </div>

      {isAdmin && (
        <Suspense
          fallback={
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          }
        >
          <AdminActivitySection />
        </Suspense>
      )}
    </div>
  );
}
