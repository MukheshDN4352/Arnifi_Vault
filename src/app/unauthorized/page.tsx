import Link from "next/link";
import { ShieldX, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-arnifi-bg flex items-center justify-center p-6">
      <div className="text-center max-w-md animate-slide-in">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-arnifi-ink mb-3">
          Access Denied
        </h1>
        <p className="text-arnifi-muted text-sm leading-relaxed mb-8">
          You don&apos;t have permission to view this page. This area requires
          administrator access.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 btn-primary px-6 py-2.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
