"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Loader2, ClipboardCheck } from "lucide-react";
import { createCheckout } from "@/actions/checkout.actions";
import { formatForInput } from "@/lib/utils/format";

export interface CheckoutTarget {
  id: string;
  code: string;
  name: string;
  ownerLabel: string;
}

interface CheckoutDialogProps {
  target: CheckoutTarget | null;
  onClose: () => void;
}

export function CheckoutDialog({ target, onClose }: CheckoutDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [takenByName, setTakenByName] = useState("");
  const [takenByDetail, setTakenByDetail] = useState("");
  const [purpose, setPurpose] = useState("");
  const [checkedOutAt, setCheckedOutAt] = useState(() => formatForInput(new Date()));
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  if (!target) return null;

  const close = () => {
    setTakenByName("");
    setTakenByDetail("");
    setPurpose("");
    setErrors({});
    onClose();
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const fd = new FormData();
      fd.set("documentId", target.id);
      fd.set("takenByName", takenByName);
      if (takenByDetail) fd.set("takenByDetail", takenByDetail);
      if (purpose) fd.set("purpose", purpose);
      fd.set("checkedOutAt", checkedOutAt);

      const res = await createCheckout(fd);
      if (res.success) {
        toast.success(res.message);
        close();
        router.refresh();
      } else {
        setErrors(res.errors ?? {});
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <ClipboardCheck className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-arnifi-ink">Checkout Document</h3>
              <p className="text-xs text-arnifi-muted">
                Removes it from the active vault — this can&apos;t be undone.
              </p>
            </div>
          </div>
          <button onClick={close} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-arnifi-bg">
            <X className="w-4 h-4 text-arnifi-muted" />
          </button>
        </div>

        <div className="mb-4 p-3 rounded-xl bg-arnifi-bg border border-arnifi-border">
          <p className="text-sm font-medium text-arnifi-ink">{target.name}</p>
          <p className="text-xs text-arnifi-muted mt-0.5">
            <span className="font-mono">{target.code}</span> · {target.ownerLabel}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-arnifi-ink">
                Taken by <span className="text-red-500">*</span>
              </label>
              <input
                value={takenByName}
                onChange={(e) => setTakenByName(e.target.value)}
                placeholder="e.g. Rahul Verma"
                className={`vault-input ${errors.takenByName ? "border-red-400" : ""}`}
                autoFocus
              />
              {errors.takenByName?.map((m) => <p key={m} className="text-xs text-red-500">{m}</p>)}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-arnifi-ink">
                Contact / Dept <span className="text-arnifi-muted font-normal">(optional)</span>
              </label>
              <input
                value={takenByDetail}
                onChange={(e) => setTakenByDetail(e.target.value)}
                placeholder="e.g. Operations"
                className="vault-input"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-arnifi-ink">
              Taken at <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={checkedOutAt}
              onChange={(e) => setCheckedOutAt(e.target.value)}
              className={`vault-input ${errors.checkedOutAt ? "border-red-400" : ""}`}
            />
            {errors.checkedOutAt?.map((m) => <p key={m} className="text-xs text-red-500">{m}</p>)}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-arnifi-ink">
              Purpose <span className="text-arnifi-muted font-normal">(optional)</span>
            </label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={2}
              placeholder="Why is it being taken?"
              className="vault-input resize-none"
            />
          </div>

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
              disabled={isPending || !takenByName.trim()}
              className="btn-primary flex items-center gap-2 px-5 py-2 text-sm disabled:opacity-60"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
              Confirm Checkout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
