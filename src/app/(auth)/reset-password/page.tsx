import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata = { title: "Set a new password — Arnifi Vault" };

export default async function ResetPasswordPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  // Voluntary visits are bounced home; this page is for forced first-login resets.
  if (!session.user.mustResetPassword) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAFC]">
      <div className="w-full max-w-[420px]">
        <div className="vault-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-arnifi-violet rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-arnifi-ink tracking-tight">
                Set a new password
              </h1>
              <p className="text-xs text-arnifi-muted">
                For security, choose a new password before continuing.
              </p>
            </div>
          </div>

          <ResetPasswordForm />
        </div>

        <p className="mt-6 text-center text-xs text-arnifi-muted">
          Signed in as {session.user.email}
        </p>
      </div>
    </div>
  );
}
