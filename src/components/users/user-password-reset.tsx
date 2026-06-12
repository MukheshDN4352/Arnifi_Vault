"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, Loader2, Eye, EyeOff } from "lucide-react";
import { resetUserPassword } from "@/actions/user.actions";

export function UserPasswordReset({ userId }: { userId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors([]);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", userId);
      fd.set("newPassword", pw);
      const res = await resetUserPassword(fd);
      if (res.success) {
        toast.success(res.message);
        setPw("");
        router.refresh();
      } else {
        setErrors(res.errors?.newPassword ?? [res.message]);
      }
    });
  };

  return (
    <div className="vault-card">
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
          <KeyRound className="w-4 h-4 text-amber-600" />
        </div>
        <h2 className="text-sm font-semibold text-arnifi-ink">Reset Password</h2>
      </div>
      <p className="text-xs text-arnifi-muted mb-4">
        Set a new password for this user. They&apos;ll be required to change it on
        their next login.
      </p>

      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3 sm:items-start">
        <div className="flex-1 space-y-1.5">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="New password"
              autoComplete="new-password"
              className={`vault-input pr-10 ${errors.length ? "border-red-400" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-arnifi-muted hover:text-arnifi-ink"
              tabIndex={-1}
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.map((m) => (
            <p key={m} className="text-xs text-red-500">{m}</p>
          ))}
        </div>
        <button
          type="submit"
          disabled={isPending || !pw}
          className="btn-primary flex items-center justify-center gap-2 px-5 h-[42px] disabled:opacity-60"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
          Reset
        </button>
      </form>
    </div>
  );
}
