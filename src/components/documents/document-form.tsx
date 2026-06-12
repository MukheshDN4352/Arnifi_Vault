"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Loader2, ArrowLeft, Lock, ExternalLink } from "lucide-react";
import Link from "next/link";
import { createDocument, updateDocument } from "@/actions/document.actions";
import { FileUpload } from "@/components/shared/file-upload";
import { OwnerCreateModal, type CreatedOwner } from "@/components/documents/owner-create-modal";
import { SearchableSelect } from "@/components/shared/searchable-select";
import {
  getLocationOptions,
  getLockerOptions,
  getRackOptions,
} from "@/lib/config/vault-locations";
import type { Document } from "@prisma/client";
import type { UploadedFile, SelectItem, ClientSelectItem } from "@/types";

type DocumentWithOwnerObjs = Document & {
  company: { id: string; name: string } | null;
  client: { id: string; name: string } | null;
};

interface DocumentFormProps {
  mode: "create" | "edit";
  document?: DocumentWithOwnerObjs;
  companies: SelectItem[];
  clients: ClientSelectItem[];
  categories: string[];
}

type OwnerType = "company" | "client";

export function DocumentForm({
  mode,
  document,
  companies,
  clients,
  categories,
}: DocumentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [companyList, setCompanyList] = useState<SelectItem[]>(companies);
  const [clientList, setClientList] = useState<ClientSelectItem[]>(clients);
  const [ownerModal, setOwnerModal] = useState<OwnerType | null>(null);

  const [name, setName] = useState(document?.name ?? "");
  const [ownerType, setOwnerType] = useState<OwnerType>(document?.clientId ? "client" : "company");
  const [companyId, setCompanyId] = useState(document?.companyId ?? "");
  const [clientId, setClientId] = useState(document?.clientId ?? "");
  const [category, setCategory] = useState(document?.category ?? "");
  const [categoryOther, setCategoryOther] = useState(document?.categoryOther ?? "");
  const [description, setDescription] = useState(document?.description ?? "");
  const [location, setLocation] = useState<string>(document?.location ?? "");
  const [lockerNo, setLockerNo] = useState(document?.lockerNo ?? "");
  const [rackNo, setRackNo] = useState(document?.rackNo ?? "");
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const selectedClient = clientList.find((c) => c.id === clientId);

  const handleLocation = (v: string) => {
    setLocation(v);
    setLockerNo("");
    setRackNo("");
  };
  const handleLocker = (v: string) => {
    setLockerNo(v);
    setRackNo("");
  };

  const handleOwnerCreated = (item: CreatedOwner) => {
    if (ownerModal === "company") {
      setCompanyList((prev) => [{ id: item.id, name: item.name }, ...prev]);
      setOwnerType("company");
      setCompanyId(item.id);
    } else {
      setClientList((prev) => [
        { id: item.id, name: item.name, companyId: item.companyId ?? null, companyName: item.companyName ?? null },
        ...prev,
      ]);
      setOwnerType("client");
      setClientId(item.id);
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const fd = new FormData();
      fd.set("name", name);
      fd.set("category", category);
      if (category === "Other") fd.set("categoryOther", categoryOther);
      if (description) fd.set("description", description);
      if (ownerType === "company") fd.set("companyId", companyId);
      else fd.set("clientId", clientId);
      fd.set("location", location);
      fd.set("lockerNo", lockerNo);
      fd.set("rackNo", rackNo);

      // The scan is uploaded once, at creation only. Edits never send file
      // fields, and the server ignores them on update regardless.
      if (mode === "create" && uploadedFile) {
        fd.set("fileUrl", uploadedFile.fileUrl);
        fd.set("fileKey", uploadedFile.fileKey);
        fd.set("fileName", uploadedFile.fileName);
        fd.set("fileSize", String(uploadedFile.fileSize));
        fd.set("mimeType", uploadedFile.mimeType);
      }

      const res =
        mode === "create" ? await createDocument(fd) : await updateDocument(document!.id, fd);

      if (res.success) {
        toast.success(res.message);
        router.push("/documents");
        router.refresh();
      } else {
        setErrors(res.errors ?? {});
        toast.error(res.message);
      }
    });
  };

  const lockerOptions = getLockerOptions(location);
  const rackOptions = getRackOptions(location, lockerNo);

  // "Other" pinned at the top; persisted custom categories follow.
  const categoryOptions = [
    { value: "Other", label: "Other (add a new category)" },
    ...categories.map((c) => ({ value: c, label: c })),
  ];
  if (category && category !== "Other" && !categories.includes(category)) {
    categoryOptions.push({ value: category, label: category });
  }
  const companyOptions = companyList.map((c) => ({ value: c.id, label: c.name }));
  const clientOptions = clientList.map((c) => ({ value: c.id, label: c.name }));

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Document info */}
        <div className="vault-card">
          <h2 className="text-sm font-semibold text-arnifi-ink mb-5 pb-4 border-b border-arnifi-border">
            Document Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-arnifi-ink">
                Document Name <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. CEO Passport (Original)"
                className={`vault-input ${errors.name ? "border-red-400" : ""}`}
              />
              {errors.name?.map((m) => <p key={m} className="text-xs text-red-500">{m}</p>)}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-arnifi-ink">
                Category <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={categoryOptions}
                value={category}
                onChange={setCategory}
                placeholder="Select category"
                searchPlaceholder="Search categories…"
                error={!!errors.category}
              />
              {errors.category?.map((m) => <p key={m} className="text-xs text-red-500">{m}</p>)}
            </div>

            {/* Category Other (revealed) */}
            {category === "Other" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-arnifi-ink">
                  Specify Category <span className="text-red-500">*</span>
                </label>
                <input
                  value={categoryOther}
                  onChange={(e) => setCategoryOther(e.target.value)}
                  placeholder="e.g. Trade License"
                  className={`vault-input ${errors.categoryOther ? "border-red-400" : ""}`}
                />
                {errors.categoryOther?.map((m) => <p key={m} className="text-xs text-red-500">{m}</p>)}
              </div>
            )}

            {/* Description */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-arnifi-ink">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Brief description, purpose, or notes"
                className="vault-input resize-none"
              />
            </div>
          </div>
        </div>

        {/* Owner */}
        <div className="vault-card">
          <h2 className="text-sm font-semibold text-arnifi-ink mb-1">Document Owner</h2>
          <p className="text-xs text-arnifi-muted mb-4">
            Documents belong to a company or to a client. Choose one.
          </p>

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
                {t}
              </button>
            ))}
          </div>

          {ownerType === "company" ? (
            <div className="space-y-1.5 max-w-md">
              <label className="text-sm font-medium text-arnifi-ink">
                Company <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={companyOptions}
                value={companyId}
                onChange={setCompanyId}
                placeholder="Select company"
                searchPlaceholder="Search companies…"
                error={!!errors.companyId}
                createLabel="New company"
                onCreate={() => setOwnerModal("company")}
              />
              {errors.companyId?.map((m) => <p key={m} className="text-xs text-red-500">{m}</p>)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-arnifi-ink">
                  Client <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={clientOptions}
                  value={clientId}
                  onChange={setClientId}
                  placeholder="Select client"
                  searchPlaceholder="Search clients…"
                  error={!!errors.companyId}
                  createLabel="New client"
                  onCreate={() => setOwnerModal("client")}
                />
                {errors.companyId?.map((m) => <p key={m} className="text-xs text-red-500">{m}</p>)}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-arnifi-ink">Company</label>
                <input
                  readOnly
                  value={selectedClient ? (selectedClient.companyName ?? "Individual") : "—"}
                  className="vault-input bg-arnifi-bg cursor-not-allowed text-arnifi-muted"
                />
                <p className="text-[11px] text-arnifi-muted">Auto-filled from the client.</p>
              </div>
            </div>
          )}
        </div>

        {/* Storage location */}
        <div className="vault-card">
          <h2 className="text-sm font-semibold text-arnifi-ink mb-1">Storage Location</h2>
          <p className="text-xs text-arnifi-muted mb-4">
            Where the physical document is stored. Locker and rack depend on the location.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-arnifi-ink">
                Location <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={getLocationOptions()}
                value={location}
                onChange={handleLocation}
                placeholder="Select location"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-arnifi-ink">
                Locker No <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={lockerOptions}
                value={lockerNo}
                onChange={handleLocker}
                placeholder="Select locker"
                disabled={!location}
                disabledHint="Select location first"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-arnifi-ink">
                Rack No <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={rackOptions}
                value={rackNo}
                onChange={setRackNo}
                placeholder="Select rack"
                disabled={!lockerNo}
                disabledHint="Select locker first"
                error={!!errors.rackNo}
              />
              {errors.rackNo?.map((m) => <p key={m} className="text-xs text-red-500">{m}</p>)}
            </div>
          </div>
        </div>

        {/* Document scan — upload once at creation; immutable afterwards */}
        {mode === "create" ? (
          <div className="vault-card">
            <h2 className="text-sm font-semibold text-arnifi-ink mb-1">Document Scan / Photo</h2>
            <p className="text-xs text-arnifi-muted mb-3">
              Upload a scanned copy or photo for reference (optional). Stored securely in AWS S3.
            </p>
            <FileUpload onUpload={setUploadedFile} onRemove={() => setUploadedFile(null)} />
          </div>
        ) : (
          <div className="vault-card">
            <h2 className="text-sm font-semibold text-arnifi-ink mb-1">Document Scan / Photo</h2>
            <div className="mb-3 flex items-start gap-2 p-3 rounded-xl bg-arnifi-bg border border-arnifi-border">
              <Lock className="w-4 h-4 text-arnifi-muted flex-shrink-0 mt-0.5" />
              <p className="text-xs text-arnifi-muted">
                The document scan is set at creation and{" "}
                <span className="font-semibold text-arnifi-ink">cannot be changed</span>. You can
                still edit all other details below.
              </p>
            </div>
            {document?.fileUrl ? (
              <a
                href={`/api/files/view?id=${document.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-arnifi-border text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View uploaded file{document.fileName ? ` · ${document.fileName}` : ""}
              </a>
            ) : (
              <p className="text-sm text-arnifi-muted">No scan was uploaded at creation.</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link
            href="/documents"
            className="flex items-center gap-2 text-sm font-medium text-arnifi-muted hover:text-arnifi-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Documents
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary flex items-center gap-2 px-6"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {mode === "create" ? "Create Document" : "Save Changes"}
          </button>
        </div>
      </form>

      <OwnerCreateModal
        type={ownerModal ?? "company"}
        open={ownerModal !== null}
        onClose={() => setOwnerModal(null)}
        onCreated={handleOwnerCreated}
        companies={companyList}
      />
    </>
  );
}
