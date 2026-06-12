"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { createClient } from "@/actions/client.actions";
import { SearchableSelect } from "@/components/shared/searchable-select";
import type { SelectItem } from "@/types";

interface ClientFormProps {
  companies: SelectItem[];
}

export function ClientForm({ companies }: ClientFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [error, setError] = useState("");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const fd = new FormData();
      fd.set("name", name);
      if (companyId) fd.set("companyId", companyId);
      const res = await createClient(fd);
      if (res.success) {
        toast.success(res.message);
        router.push("/clients");
        router.refresh();
      } else {
        setError(res.errors?.name?.[0] ?? res.errors?.companyId?.[0] ?? res.message);
        toast.error(res.message);
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="vault-card">
        <h2 className="text-sm font-semibold text-arnifi-ink mb-5 pb-4 border-b border-arnifi-border">
          Client Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-arnifi-ink">
              Client Name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Arnav Mehta"
              className={`vault-input ${error ? "border-red-400" : ""}`}
              autoFocus
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-arnifi-ink">
              Company <span className="text-arnifi-muted font-normal">(optional)</span>
            </label>
            <SearchableSelect
              options={[
                { value: "", label: "No company (individual client)" },
                ...companies.map((c) => ({ value: c.id, label: c.name })),
              ]}
              value={companyId}
              onChange={setCompanyId}
              placeholder="No company (individual client)"
              searchPlaceholder="Search companies…"
            />
            <p className="text-[11px] text-arnifi-muted">
              Link this client to a company, or leave blank for an individual.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Link
          href="/clients"
          className="flex items-center gap-2 text-sm font-medium text-arnifi-muted hover:text-arnifi-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary flex items-center gap-2 px-6"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Create Client
        </button>
      </div>
    </form>
  );
}
