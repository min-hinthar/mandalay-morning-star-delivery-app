import type { NotificationPrefs } from "@/components/ui/account/SettingsTab/settings-types";

// ===========================================
// EMAIL TYPES
// ===========================================

export type EmailType =
  | "order_confirmation"
  | "cancellation"
  | "refund"
  | "delivery_reminder"
  | "out_for_delivery"
  | "arriving_soon"
  | "delivered";

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
  }
}
