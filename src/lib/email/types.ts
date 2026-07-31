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
  | "feedback_confirmation"
  | "admin_route_decline"
  // Marketing: "we're driving your way" route-day invite. Deliberately NOT a
  // CustomerEmailType — the `notification_type` DB enum has no value for it, and
  // adding one needs a migration + `gen:types` (Docker) to satisfy the blocking
  // db-drift job. Until then it's in UNLOGGED_EMAIL_TYPES and dedupes on a
  // stable Resend idempotency key instead of a notification_logs row.
  | "route_day_invite";

interface SendEmailBaseOptions {
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

/**
 * Lowering the per-attempt ceiling REQUIRES an idempotency key — enforced by
 * the compiler, not by a comment.
 *
 * Aborting a request Resend may already have ACCEPTED and then retrying is
 * exactly what the key makes safe. Without one, a tighter ceiling buys bounded
 * duration at the cost of possibly mailing a customer twice, and that trade is
 * not one a caller should be able to make by accident. Every caller passes a
 * key today, so this costs nothing now — it exists so a future keyless caller
 * can't silently inherit the risk.
 *
 * The default (`SEND_ATTEMPT_TIMEOUT_MS`, 15s) is deliberately generous for
 * exactly the same reason: it's the ceiling a keyless send gets.
 */
export type SendEmailOptions = SendEmailBaseOptions &
  (
    | { attemptTimeoutMs?: undefined }
    | {
        /**
         * Override the per-attempt request ceiling. Requires `idempotencyKey`.
         *
         * The bulk cron lowers it, because a per-recipient ceiling is what
         * makes its wall-clock budget sound, and every one of its sends is
         * key-protected.
         */
        attemptTimeoutMs: number;
        idempotencyKey: string;
      }
  );

export interface SendEmailResult {
  success: boolean;
  resendId?: string;
  error?: string;
  /**
   * True when the send was deliberately NOT handed to Resend — the admin kill
   * switch is off, or the recipient opted out of this type.
   *
   * Both are successes (nothing went wrong), so they return `success: true`,
   * which makes `success` alone useless for answering "did mail actually go
   * out?". A bulk caller counting successes would report a full run while the
   * kill switch silently mailed nobody. Callers that report send counts must
   * tally this separately.
   */
  suppressed?: boolean;
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
  "admin_route_decline",
] as const;

/**
 * Email types NOT written to notification_logs, because the `notification_type`
 * DB enum has no value for them. Mostly admin mail; `route_day_invite` is here
 * for the same reason (see its note on EmailType) despite being customer-facing.
 *
 * Named for what it does — NOT "admin only". Membership must never be read as
 * "send to an admin" or "skip the customer opt-out": the opt-out is enforced
 * independently in Step 2 via MANDATORY_EMAIL_TYPES + mapTypeToPrefKey, and
 * `route_day_invite` (marketing) genuinely depends on that check running.
 */
export const UNLOGGED_EMAIL_TYPES: readonly EmailType[] = [
  "admin_new_order",
  "admin_daily_digest",
  "admin_feedback_alert",
  "feedback_confirmation",
  "admin_route_decline",
  "route_day_invite",
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
    case "admin_route_decline":
      return "order_updates";
    // Promotional — gated on the marketing opt-in, never mandatory.
    case "route_day_invite":
      return "marketing";
  }
}
