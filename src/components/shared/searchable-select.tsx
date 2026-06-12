"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface SelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  /** Text shown on the trigger when disabled (e.g. "Select location first"). */
  disabledHint?: string;
  error?: boolean;
  className?: string;
  /** When set, shows a pinned "create new" action at the top of the dropdown. */
  createLabel?: string;
  onCreate?: () => void;
}

/**
 * Accessible-ish searchable dropdown built without the (broken) shadcn ui
 * scaffold. Type to filter, Enter selects the top match, Escape/outside-click
 * closes. Drop-in replacement for a styled native <select>.
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  disabled,
  disabledHint,
  error,
  className,
  createLabel,
  onCreate,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "vault-input flex items-center justify-between gap-2 text-left",
          error && "border-red-400",
          disabled && "opacity-60 cursor-not-allowed",
          !selected && "text-arnifi-muted/70"
        )}
      >
        <span className="truncate">
          {selected ? selected.label : disabled && disabledHint ? disabledHint : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-arnifi-muted flex-shrink-0" />
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-arnifi-border shadow-lg overflow-hidden">
          <div className="p-2 border-b border-arnifi-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-arnifi-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-arnifi-border bg-white pl-8 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filtered.length > 0) {
                    e.preventDefault();
                    onChange(filtered[0].value);
                    setOpen(false);
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setOpen(false);
                  }
                }}
              />
            </div>
          </div>
          {onCreate && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onCreate();
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-primary-600 hover:bg-primary-50 border-b border-arnifi-border"
            >
              <Plus className="w-4 h-4" />
              {createLabel ?? "Create new"}
            </button>
          )}
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-arnifi-muted">No matches</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value || "__empty__"}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-primary-50",
                    o.value === value
                      ? "text-primary-700 font-medium bg-primary-50/50"
                      : "text-arnifi-ink"
                  )}
                >
                  <span className="truncate">{o.label}</span>
                  {o.value === value && (
                    <Check className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
