"use client";

import { useState, useTransition } from "react";
import { X, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createCompany } from "@/actions/company.actions";
import { createClient } from "@/actions/client.actions";
import { SearchableSelect } from "@/components/shared/searchable-select";
import type { SelectItem } from "@/types";

export interface CreatedOwner {
  id: string;
  name: string;
  companyId?: string | null;
  companyName?: string | null;
}

interface OwnerCreateModalProps {
  type: "company" | "client";
  open: boolean;
  onClose: () => void;
  onCreated: (item: CreatedOwner) => void;
  companies: SelectItem[];
}

export function OwnerCreateModal({
  type,
  open,
  onClose,
  onCreated,
  companies,
}: OwnerCreateModalProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const close = () => {
    setName("");
    setCompanyId("");
    setError("");
    onClose();
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      if (type === "company") {
        const fd = new FormData();
        fd.set("name", name);
        const res = await createCompany(fd);
        if (res.success && res.data) {
          toast.success("Company created");
          onCreated({ id: res.data.id, name: res.data.name });
          close();
        } else {
          setError(res.errors?.name?.[0] ?? res.message);
        }
      } else {
        const fd = new FormData();
        fd.set("name", name);
        if (companyId) fd.set("companyId", companyId);
        const res = await createClient(fd);
        if (res.success && res.data) {
          const company = companies.find((c) => c.id === companyId);
          toast.success("Client created");
          onCreated({
            id: res.data.id,
            name: res.data.name,
            companyId: companyId || null,
            companyName: company?.name ?? null,
          });
          close();
        } else {
          setError(res.errors?.name?.[0] ?? res.errors?.companyId?.[0] ?? res.message);
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-arnifi-ink">
            New {type === "company" ? "Company" : "Client"}
          </h3>
          <button
            onClick={close}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-arnifi-bg transition-colors"
          >
            <X className="w-4 h-4 text-arnifi-muted" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-arnifi-ink">
              {type === "company" ? "Company" : "Client"} Name{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === "company" ? "e.g. Arnifi Group" : "e.g. Arnav Mehta"}
              className={`vault-input ${error ? "border-red-400" : ""}`}
              autoFocus
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          {type === "client" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-arnifi-ink">
                Company <span className="text-arnifi-muted font-normal">(optional)</span>
              </label>
              <SearchableSelect
                options={[
                  { value: "", label: "No company (individual)" },
                  ...companies.map((c) => ({ value: c.id, label: c.name })),
                ]}
                value={companyId}
                onChange={setCompanyId}
                placeholder="No company (individual)"
                searchPlaceholder="Search companies…"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={close}
              className="px-4 py-2 rounded-xl text-sm font-medium text-arnifi-muted hover:bg-arnifi-bg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="btn-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-60"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
