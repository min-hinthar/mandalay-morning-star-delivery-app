import type { NotificationPrefs } from "@/components/ui/account/SettingsTab/settings-types";

// ===========================================
// EMAIL TYPES
// ===========================================

/** Customer-facing email types — must match the DB notification_type enum. */
export type CustomerEmailType =
  | "order_confirmation"
  | "cancellation"
  | "refund"
  | "delivery_reminder"
  | "out_for_delivery"
  | "arriving_soon"
  | "delivered";

/** All email types, including admin-only types not stored in notification_logs. */
export type EmailType =
  | CustomerEmailType
  | "admin_new_order"
  | "admin_daily_digest"
  | "admin_feedback_alert"
  | "feedback_confirmation";

export interface SendEmailOptions {
  to: string;
  subject: string;
  react: React.ReactElement;
  type: EmailType;
  orderId: string;
  userId: string;
  idempotencyKey?: string;
  /** If true, email is sent regardless of user preferences */
  mandatory?: boolean;
}

export interface SendEmailResult {
  success: boolean;
  resendId?: string;
  error?: string;
}

// ===========================================
// MANDATORY EMAILS (always sent regardless of prefs)
// ===========================================

export const MANDATORY_EMAIL_TYPES: readonly EmailType[] = [
  "order_confirmation",
  "refund",
  "admin_new_order",
  "admin_daily_digest",
  "admin_feedback_alert",
  "feedback_confirmation",
] as const;

/** Admin-only email types that are not logged to notification_logs (DB enum excludes them). */
export const ADMIN_EMAIL_TYPES: readonly EmailType[] = [
  "admin_new_order",
  "admin_daily_digest",
  "admin_feedback_alert",
  "feedback_confirmation",
] as const;

// ===========================================
// PREFERENCE MAPPING
// ===========================================

/**
 * Maps an EmailType to the corresponding NotificationPrefs key.
 * Used to check if the user has opted out of this email category.
 */
export function mapTypeToPrefKey(type: EmailType): keyof NotificationPrefs {
  switch (type) {
    case "order_confirmation":
    case "cancellation":
    case "refund":
      return "order_updates";
    case "delivery_reminder":
      return "reminders";
    case "out_for_delivery":
    case "arriving_soon":
    case "delivered":
      return "order_updates";
    case "admin_new_order":
    case "admin_daily_digest":
    case "admin_feedback_alert":
    case "feedback_confirmation":
      return "order_updates";
  }
}
