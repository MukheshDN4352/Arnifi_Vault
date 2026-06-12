"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileDown,
  Filter,
  BarChart3,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";

type ExportFormat = "csv" | "excel" | "pdf";

const FORMAT_CONFIG = {
  csv: {
    label: "CSV",
    description: "Spreadsheet-compatible comma-separated file",
    icon: FileText,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
  },
  excel: {
    label: "Excel",
    description: "Microsoft Excel workbook (.xlsx)",
    icon: FileSpreadsheet,
    color: "text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100",
  },
  pdf: {
    label: "PDF Report",
    description: "Formatted PDF report for printing or sharing",
    icon: FileDown,
    color: "text-red-600 bg-red-50 border-red-200 hover:bg-red-100",
  },
} as const;

export default function ReportsPage() {
  const [isPending, startTransition] = useTransition();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const handleExport = (format: ExportFormat) => {
    startTransition(async () => {
      setExporting(format);
      try {
        const params = new URLSearchParams({ format });
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        if (search) params.set("search", search);

        const response = await fetch(`/api/exports?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Export failed");
        }

        // The API returns JSON (not a file) when there are no matching rows.
        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          const data = (await response.json()) as { message?: string };
          toast.info(data.message ?? "No data to export for the selected filters.");
          return;
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        const contentDisposition = response.headers.get("content-disposition") ?? "";
        const match = contentDisposition.match(/filename="(.+)"/);
        a.download = match?.[1] ?? `vault-report.${format === "excel" ? "xlsx" : format}`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success(`${FORMAT_CONFIG[format].label} report downloaded`);
      } catch {
        toast.error("Export failed. Please try again.");
      } finally {
        setExporting(null);
      }
    });
  };

  return (
    <div className="page-container max-w-4xl">
      <PageHeader
        title="Reports & Exports"
        description="Download checkout logs with custom filters in your preferred format."
      />

      <div className="space-y-5">
        {/* Filters card */}
        <div className="vault-card">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-arnifi-border">
            <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
              <Filter className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-arnifi-ink">
                Report Filters
              </h2>
              <p className="text-xs text-arnifi-muted">
                Narrow the data included in your export
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-arnifi-ink">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="vault-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-arnifi-ink">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="vault-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-arnifi-ink">
                Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Document, code, or taker"
                className="vault-input"
              />
            </div>
          </div>

          {(dateFrom || dateTo || search) && (
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); setSearch(""); }}
              className="mt-3 text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Export format cards */}
        <div className="vault-card">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-arnifi-border">
            <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-arnifi-ink">
                Export Format
              </h2>
              <p className="text-xs text-arnifi-muted">
                All exports include full checkout details with timestamps
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(Object.entries(FORMAT_CONFIG) as [ExportFormat, typeof FORMAT_CONFIG[ExportFormat]][]).map(
              ([fmt, config]) => {
                const Icon = config.icon;
                const isExporting = exporting === fmt;
                return (
                  <button
                    key={fmt}
                    onClick={() => handleExport(fmt)}
                    disabled={isPending}
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all disabled:opacity-60 disabled:cursor-not-allowed ${config.color}`}
                  >
                    <div className="mt-0.5">
                      {isExporting ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {isExporting ? "Exporting…" : config.label}
                      </p>
                      <p className="text-xs opacity-70 mt-0.5 leading-snug">
                        {config.description}
                      </p>
                    </div>
                    {!isExporting && (
                      <Download className="w-4 h-4 ml-auto mt-0.5 opacity-60 flex-shrink-0" />
                    )}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Info box */}
        <div className="p-4 bg-primary-50/50 rounded-xl border border-primary-100 flex gap-3">
          <div className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-primary-800">Export Information</p>
            <p className="text-xs text-primary-700 mt-0.5 leading-relaxed">
              All exports include Log ID, Document, Person, Purpose, Status, Checkout Time,
              Expected Return, Actual Return, Issued By, and Returned By. A report export
              event is recorded in the audit trail.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
