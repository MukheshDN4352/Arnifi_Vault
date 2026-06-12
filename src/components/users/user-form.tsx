"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Eye, EyeOff } from "lucide-react";
import { createUser, updateUser } from "@/actions/user.actions";
import { SearchableSelect } from "@/components/shared/searchable-select";
import type { UserWithRelations, SelectItem, ClientSelectItem } from "@/types";
import type { Role } from "@prisma/client";

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "EMPLOYEE", label: "Employee" },
  { value: "CLIENT", label: "Client" },
];

interface UserFormProps {
  mode: "create" | "edit";
  user?: UserWithRelations;
  companies: SelectItem[];
  clients: ClientSelectItem[];
}

type OwnerType = "company" | "client";

const ROLE_DESCRIPTIONS: Record<string, string> = {
  ADMIN: "Full access — manage documents, users, checkouts, and reports.",
  EMPLOYEE: "Read-only — can view all documents across every company and client.",
  CLIENT: "Read-only — sees only documents owned by their company or client.",
};

export function UserForm({ mode, user, companies, clients }: UserFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(user?.role ?? ("EMPLOYEE" as Role));
  const [ownerType, setOwnerType] = useState<OwnerType>(
    user?.clientId ? "client" : "company"
  );
  const [companyId, setCompanyId] = useState(user?.companyId ?? "");
  const [clientId, setClientId] = useState(user?.clientId ?? "");
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const selectedClient = clients.find((c) => c.id === clientId);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const fd = new FormData();
      fd.set("name", name);
      fd.set("email", email);
      if (mode === "create") fd.set("password", password);
      fd.set("role", role);
      if (role === "CLIENT") {
        if (ownerType === "company") fd.set("companyId", companyId);
        else fd.set("clientId", clientId);
      }

      const res =
        mode === "create" ? await createUser(fd) : await updateUser(user!.id, fd);

      if (res.success) {
        toast.success(res.message);
        router.push("/users");
        router.refresh();
      } else {
        setErrors(res.errors ?? {});
        toast.error(res.message);
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="vault-card">
        <h2 className="text-sm font-semibold text-arnifi-ink mb-5 pb-4 border-b border-arnifi-border">
          Account Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-arnifi-ink">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Nair"
              className={`vault-input ${errors.name ? "border-red-400" : ""}`}
            />
            {errors.name?.map((m) => (
              <p key={m} className="text-xs text-red-500">{m}</p>
            ))}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-arnifi-ink">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@arnifi.com"
              autoComplete="off"
              className={`vault-input ${errors.email ? "border-red-400" : ""}`}
            />
            {errors.email?.map((m) => (
              <p key={m} className="text-xs text-red-500">{m}</p>
            ))}
          </div>

          {/* Password (create only — edit uses the reset action) */}
          {mode === "create" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-arnifi-ink">
                Initial Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  className={`vault-input pr-10 ${errors.password ? "border-red-400" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-arnifi-muted hover:text-arnifi-ink"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-arnifi-muted">
                Uppercase, lowercase, and a number. The user must change it on first login.
              </p>
              {errors.password?.map((m) => (
                <p key={m} className="text-xs text-red-500">{m}</p>
              ))}
            </div>
          )}

          {/* Role */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-arnifi-ink">
              Role <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              options={ROLE_OPTIONS}
              value={role}
              onChange={(v) => setRole(v as Role)}
              placeholder="Select role"
            />
            <p className="text-[11px] text-arnifi-muted">{ROLE_DESCRIPTIONS[role]}</p>
          </div>
        </div>
      </div>

      {/* CLIENT owner linkage */}
      {role === "CLIENT" && (
        <div className="vault-card">
          <h2 className="text-sm font-semibold text-arnifi-ink mb-1">
            Client Access Scope
          </h2>
          <p className="text-xs text-arnifi-muted mb-4">
            Choose what this login can see. A company account sees its company&apos;s
            documents and all its clients&apos; documents; a client account sees only
            its own.
          </p>

          {/* Owner type chooser */}
          <div className="flex gap-2 mb-4">
            {(["company", "client"] as OwnerType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setOwnerType(t)}
                className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium capitalize transition-colors ${
                  ownerType === t
                    ? "bg-primary-50 text-primary-700 border-primary-200"
                    : "bg-arnifi-bg text-arnifi-muted border-arnifi-border hover:bg-primary-50/50"
                }`}
              >
                {t === "company" ? "Company account" : "Individual client"}
              </button>
            ))}
          </div>

          {ownerType === "company" ? (
            <div className="space-y-1.5 max-w-md">
              <label className="text-sm font-medium text-arnifi-ink">
                Company <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={companies.map((c) => ({ value: c.id, label: c.name }))}
                value={companyId}
                onChange={setCompanyId}
                placeholder="Select company"
                searchPlaceholder="Search companies…"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-arnifi-ink">
                  Client <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={clients.map((c) => ({ value: c.id, label: c.name }))}
                  value={clientId}
                  onChange={setClientId}
                  placeholder="Select client"
                  searchPlaceholder="Search clients…"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-arnifi-ink">Company</label>
                <input
                  readOnly
                  value={selectedClient?.companyName ?? "—"}
                  className="vault-input bg-arnifi-bg cursor-not-allowed text-arnifi-muted"
                />
                <p className="text-[11px] text-arnifi-muted">Derived from the client.</p>
              </div>
            </div>
          )}

          {errors.clientId?.map((m) => (
            <p key={m} className="text-xs text-red-500 mt-2">{m}</p>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Link
          href="/users"
          className="flex items-center gap-2 text-sm font-medium text-arnifi-muted hover:text-arnifi-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary flex items-center gap-2 px-6"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {mode === "create" ? "Create User" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
