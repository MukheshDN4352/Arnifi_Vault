"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // Always prevent the browser from doing a native form submit
    e.preventDefault();
    e.stopPropagation();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error || !result?.ok) {
        setError("Invalid email or password. Please try again.");
        setLoading(false);
        return;
      }

      // Success — go to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("[login] signIn error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-arnifi-ink tracking-tight">
          Sign in
        </h2>
        <p className="mt-2 text-arnifi-muted text-sm">
          Access your secure vault logbook
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl">
          <span className="text-red-500 flex-shrink-0 mt-0.5">⚠</span>
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} method="post" noValidate className="space-y-5">
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-arnifi-ink block">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-arnifi-muted pointer-events-none" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@arnifi.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="vault-input pl-10 disabled:opacity-60"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-arnifi-ink block">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-arnifi-muted pointer-events-none" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="vault-input pl-10 pr-11 disabled:opacity-60"
              required
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-arnifi-muted hover:text-arnifi-ink transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary flex items-center justify-center gap-2 h-11 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing in…</span>
            </>
          ) : (
            <>
              <span>Sign in to Vault</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-xs text-arnifi-muted">
        Having trouble?{" "}
        <a
          href="mailto:admin@arnifi.com"
          className="text-primary-600 hover:underline font-medium"
        >
          Contact your administrator
        </a>
      </p>
    </div>
  );
}
