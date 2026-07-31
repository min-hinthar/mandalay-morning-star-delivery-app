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
  | "delivered"
  // Marketing: "we're driving your way" route-day invite. The app's only
  // outbound marketing send, and now a real logged type — the enum value
  // landed in 20260731210000_add_route_day_invite_notification_type.sql, so a
  // notification_logs row can finally record who was mailed and when.
  //
  // It stays in NO_CC_EMAIL_TYPES (that suppression is deliberate: a bulk run
  // would otherwise put an internal address in up to 100 customers' CC
  // headers), and it is NOT mandatory — mapTypeToPrefKey routes it to the
  // `marketing` opt-out, which is what makes the opt-out consent model
  // defensible.
  | "route_day_invite";

/** All email types, including admin-only types not stored in notification_logs. */
export type EmailType =
  | CustomerEmailType
  | "admin_new_order"
  | "admin_daily_digest"
  | "admin_feedback_alert"
  | "feedback_confirmation"
  | "admin_route_decline";

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
 * DB enum has no value for them.
 *
 * Named for what it does — NOT "admin only". Membership must never be read as
 * "send to an admin" or "skip the customer opt-out": the opt-out is enforced
 * independently in Step 2 via MANDATORY_EMAIL_TYPES + mapTypeToPrefKey.
 *
 * This list must stay the exact complement of CustomerEmailType within
 * EmailType — every type the enum knows about gets logged, every type it
 * doesn't must be listed here or the insert throws 22P02/enum-mismatch inside
 * the retry loop and reads as a send failure.
 */
export const UNLOGGED_EMAIL_TYPES: readonly EmailType[] = [
  "admin_new_order",
  "admin_daily_digest",
  "admin_feedback_alert",
  "feedback_confirmation",
  "admin_route_decline",
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
