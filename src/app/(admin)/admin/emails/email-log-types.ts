// ===========================================
// EMAIL LOG SHARED TYPES & CONSTANTS
// ===========================================

export interface EmailLogEntry {
  id: string;
  order_id: string;
  user_id: string;
  notification_type: string;
  channel: string;
  recipient: string;
  subject: string;
  resend_id: string | null;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const EMAIL_TYPES = [
  { value: "", label: "All Types" },
  { value: "order_confirmation", label: "Order Confirmation" },
  { value: "cancellation", label: "Cancellation" },
  { value: "refund", label: "Refund" },
  { value: "delivery_reminder", label: "Delivery Reminder" },
];

export const EMAIL_STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "sent", label: "Sent" },
  { value: "delivered", label: "Delivered" },
  { value: "opened", label: "Opened" },
  { value: "clicked", label: "Clicked" },
  { value: "failed", label: "Failed" },
  { value: "bounced", label: "Bounced" },
];

type StatusVariant =
  | "default"
  | "status-info"
  | "status-success"
  | "status-warning"
  | "status-error"
  | "secondary";

export const STATUS_BADGE_MAP: Record<string, StatusVariant> = {
  pending: "default",
  sent: "status-info",
  delivered: "status-success",
  opened: "secondary",
  clicked: "status-info",
  failed: "status-error",
  bounced: "status-warning",
};

export const PAGE_SIZE = 20;

export function formatEmailDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatEmailType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
