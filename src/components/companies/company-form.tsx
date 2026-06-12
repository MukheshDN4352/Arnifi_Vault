"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { createCompany } from "@/actions/company.actions";

export function CompanyForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const fd = new FormData();
      fd.set("name", name);
      const res = await createCompany(fd);
      if (res.success) {
        toast.success(res.message);
        router.push("/companies");
        router.refresh();
      } else {
        setError(res.errors?.name?.[0] ?? res.message);
        toast.error(res.message);
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="vault-card">
        <h2 className="text-sm font-semibold text-arnifi-ink mb-5 pb-4 border-b border-arnifi-border">
          Company Information
        </h2>
        <div className="space-y-1.5 max-w-md">
          <label className="text-sm font-medium text-arnifi-ink">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Arnifi Group"
            className={`vault-input ${error ? "border-red-400" : ""}`}
            autoFocus
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Link
          href="/companies"
          className="flex items-center gap-2 text-sm font-medium text-arnifi-muted hover:text-arnifi-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Companies
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary flex items-center gap-2 px-6"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Create Company
        </button>
      </div>
    </form>
  );
}
