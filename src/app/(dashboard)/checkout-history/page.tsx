import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getCheckouts } from "@/actions/checkout.actions";
import { CheckoutHistoryTable } from "@/components/checkouts/checkout-history-table";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Checkout History" };

interface Props {
  searchParams: Promise<{
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}

export default async function CheckoutHistoryPage({ searchParams }: Props) {
  const [session, params] = await Promise.all([auth(), searchParams]);
  if (session?.user?.role !== "ADMIN") redirect("/unauthorized");

  const result = await getCheckouts({
    search: params.search,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    page: params.page ? Number(params.page) : 1,
    limit: 20,
  });

  return (
    <div className="page-container">
      <PageHeader
        title="Checkout History"
        description="Immutable record of every document removed from the vault."
        badge={`${result.total} total`}
      />
      <CheckoutHistoryTable result={result} />
    </div>
  );
}
