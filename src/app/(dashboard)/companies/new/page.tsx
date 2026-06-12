import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { CompanyForm } from "@/components/companies/company-form";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "New Company" };

export default async function NewCompanyPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/unauthorized");

  return (
    <div className="page-container max-w-2xl">
      <PageHeader title="New Company" description="Register a new company." />
      <CompanyForm />
    </div>
  );
}
