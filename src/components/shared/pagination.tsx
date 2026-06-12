"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  total,
  limit,
  onPageChange,
}: PaginationProps) {
  const start = (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, total);

  if (totalPages <= 1) return null;

  // Generate page numbers to show
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-arnifi-border">
      <p className="text-xs text-arnifi-muted hidden sm:block">
        Showing <span className="font-medium text-arnifi-ink">{start}</span>–
        <span className="font-medium text-arnifi-ink">{end}</span> of{" "}
        <span className="font-medium text-arnifi-ink">{total}</span> results
      </p>

      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-arnifi-border text-arnifi-muted hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((page, i) =>
          page === "..." ? (
            <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-arnifi-muted text-sm">
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors",
                currentPage === page
                  ? "bg-primary-600 text-white border border-primary-600"
                  : "border border-arnifi-border text-arnifi-muted hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200"
              )}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-arnifi-border text-arnifi-muted hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
