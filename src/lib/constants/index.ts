export const APP_NAME = "Arnifi Vault";
export const APP_TAGLINE = "Secure Document Logbook";

export const DOCUMENT_CATEGORIES = [
  "Passport",
  "National ID",
  "Visa",
  "Trade License",
  "Incorporation Certificate",
  "Property Document",
  "Legal Agreement",
  "Share Certificate",
  "Tax Document",
  "Compliance Record",
  "Bank Document",
  "Insurance",
  "Other",
] as const;

export const DEPARTMENTS = [
  "Finance",
  "Legal",
  "Operations",
  "Human Resources",
  "IT",
  "Management",
  "External Audit",
  "Compliance",
  "Sales",
  "Marketing",
  "Other",
] as const;

export const PAGINATION_LIMITS = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_LIMIT = 20;

export const ACCEPTED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const STATUS_COLORS = {
  AVAILABLE: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    label: "Available",
  },
  CHECKED_OUT: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    label: "Checked Out",
  },
  ACTIVE: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
    label: "Active",
  },
  RETURNED: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    label: "Returned",
  },
  OVERDUE: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
    label: "Overdue",
  },
} as const;

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  LOGIN: "User Login",
  LOGOUT: "User Logout",
  DOCUMENT_CREATED: "Document Created",
  DOCUMENT_UPDATED: "Document Updated",
  DOCUMENT_CHECKED_OUT: "Document Checked Out",
  COMPANY_CREATED: "Company Created",
  CLIENT_CREATED: "Client Created",
  USER_CREATED: "User Created",
  USER_UPDATED: "User Updated",
  USER_PASSWORD_RESET: "Password Reset (by admin)",
  PASSWORD_RESET_SELF: "Password Changed",
  USER_DEACTIVATED: "User Deactivated",
  USER_ACTIVATED: "User Activated",
  REPORT_EXPORTED: "Report Exported",
};
