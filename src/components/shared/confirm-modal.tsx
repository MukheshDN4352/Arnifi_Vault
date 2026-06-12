"use client";

import { useTransition } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "danger" | "warning";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "danger",
}: ConfirmModalProps) {
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleConfirm = () => {
    startTransition(async () => {
      await onConfirm();
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-in">
        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              variant === "danger" ? "bg-red-50" : "bg-amber-50"
            }`}
          >
            <AlertTriangle
              className={`w-5 h-5 ${variant === "danger" ? "text-red-500" : "text-amber-500"}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-arnifi-ink">{title}</h3>
            <p className="mt-1.5 text-sm text-arnifi-muted leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2.5 text-sm font-medium text-arnifi-ink bg-arnifi-bg hover:bg-arnifi-border/50 rounded-xl transition-colors border border-arnifi-border disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className={`px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors flex items-center gap-2 disabled:opacity-70 ${
              variant === "danger"
                ? "bg-red-500 hover:bg-red-600"
                : "bg-amber-500 hover:bg-amber-600"
            }`}
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
