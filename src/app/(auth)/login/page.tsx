// Server Component — no "use client" needed here.
// LoginForm is the only client part and it no longer uses useSearchParams,
// so no Suspense boundary is needed either.

import { Shield } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in — Arnifi Vault" };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel (desktop only) ───────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative bg-gradient-to-br from-primary-600 via-primary-700 to-arnifi-violet flex-col justify-between p-12 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center border border-white/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-semibold text-lg">Arnifi Vault</span>
        </div>

        {/* Hero */}
        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-5xl font-bold text-white leading-[1.1] tracking-tight">
              Secure Document
              <br />
              <span className="text-white/80">Logbook System</span>
            </h1>
            <p className="mt-4 text-white/60 text-lg leading-relaxed max-w-sm">
              Track every document movement with a complete audit trail. Built
              for enterprise security and compliance.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Immutable Audit Trail", "Role-Based Access", "S3 Document Storage", "Export Reports"].map((f) => (
              <span key={f} className="px-3 py-1.5 bg-white/10 rounded-full text-white/80 text-xs font-medium border border-white/10">
                {f}
              </span>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/40 text-sm">©2024 Arnifi Group · All rights reserved</p>
      </div>

      {/* ── Right form panel ──────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-[#F8FAFC]">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-arnifi-violet rounded-xl flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-arnifi-ink">Arnifi Vault</span>
          </div>

          {/* Form — no Suspense needed (no useSearchParams) */}
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
