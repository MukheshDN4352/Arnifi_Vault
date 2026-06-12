import { format, formatDistanceToNow, isAfter, parseISO } from "date-fns";

// ─── Date formatting ─────────────────────────────────────────

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return format(d, "dd MMM yyyy");
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return format(d, "dd MMM yyyy, hh:mm a");
}

export function formatDateTimeShort(
  date: Date | string | null | undefined
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return format(d, "dd MMM, hh:mm a");
}

export function formatRelativeTime(
  date: Date | string | null | undefined
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return formatDistanceToNow(d, { addSuffix: true });
}

export function isOverdue(expectedReturnAt: Date | string): boolean {
  const d =
    typeof expectedReturnAt === "string"
      ? new Date(expectedReturnAt)
      : expectedReturnAt;
  return isAfter(new Date(), d);
}

export function formatForInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

// ─── File utilities ──────────────────────────────────────────

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toUpperCase() ?? "";
}

export function isImageFile(mimeType: string | null | undefined): boolean {
  if (!mimeType) return false;
  return mimeType.startsWith("image/");
}

export function isPdfFile(mimeType: string | null | undefined): boolean {
  if (!mimeType) return false;
  return mimeType === "application/pdf";
}

// ─── ID generation ───────────────────────────────────────────

export function generateDocumentId(count: number): string {
  return `DOC-${String(count + 1).padStart(3, "0")}`;
}

export function generateLogId(): string {
  const now = new Date();
  const datePart = format(now, "yyyyMMdd");
  const timePart = format(now, "HHmmss");
  return `LOG-${datePart}-${timePart}`;
}

// ─── Text utilities ──────────────────────────────────────────

export function truncate(str: string, length = 50): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function formatStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .split(" ")
    .map(capitalize)
    .join(" ");
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
