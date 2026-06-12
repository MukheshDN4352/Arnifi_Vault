"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Lock, Loader2, Eye, EyeOff, ArrowRight } from "lucide-react";
import { resetOwnPassword } from "@/actions/auth.actions";

export function ResetPasswordForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const res = await resetOwnPassword(fd);

    if (res.success) {
      toast.success(res.message);
      // Force a fresh session so mustResetPassword clears from the token.
      await signOut({ redirect: false });
      router.push("/login");
    } else {
      setErrors(res.errors ?? {});
      if (!res.errors) toast.error(res.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* New password */}
      <div className="space-y-1.5">
        <label htmlFor="newPassword" className="text-sm font-medium text-arnifi-ink block">
          New password
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-arnifi-muted pointer-events-none" />
          <input
            id="newPassword"
            name="newPassword"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            disabled={loading}
            className={`vault-input pl-10 pr-11 disabled:opacity-60 ${errors.newPassword ? "border-red-400" : ""}`}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-arnifi-muted hover:text-arnifi-ink transition-colors"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.newPassword?.map((m) => (
          <p key={m} className="text-xs text-red-500">{m}</p>
        ))}
        <p className="text-xs text-arnifi-muted">
          At least 8 characters, with an uppercase letter, a lowercase letter, and a number.
        </p>
      </div>

      {/* Confirm password */}
      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-arnifi-ink block">
          Confirm password
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-arnifi-muted pointer-events-none" />
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            disabled={loading}
            className={`vault-input pl-10 disabled:opacity-60 ${errors.confirmPassword ? "border-red-400" : ""}`}
          />
        </div>
        {errors.confirmPassword?.map((m) => (
          <p key={m} className="text-xs text-red-500">{m}</p>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary flex items-center justify-center gap-2 h-11 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Updating…</span>
          </>
        ) : (
          <>
            <span>Set new password</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
