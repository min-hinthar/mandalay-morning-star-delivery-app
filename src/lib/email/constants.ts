// ===========================================
// EMAIL CONSTANTS
// ===========================================

export const EMAIL_FROM =
  "Mandalay Morning Star Burmese Kitchen (Los Angeles) <admin@mandalaymorningstar.com>";

export const EMAIL_REPLY_TO = "admin@mandalaymorningstar.com";

/**
 * CC'd on outbound CUSTOMER emails so admin keeps a monitoring copy and the
 * customer can reach the kitchen by replying in the same thread.
 * NOTE: intentionally NOT applied to the sign-in / magic-link email — that one
 * carries a one-time login token, which must never land in a shared inbox.
 */
export const EMAIL_CC = ["admin@mandalaymorningstar.com"];

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://mandalaymorningstar.com";

// ===========================================
// BRAND COLORS (for email templates)
// ===========================================

export const BRAND_COLORS = {
  primary: "#A41034",
  secondary: "#EBCD00",
  accent: "#3D8B22",
  warmBg: "#FFF9E6",
  darkBrown: "#8B4513",
  gold: "#D4A017",
} as const;

// ===========================================
// BUSINESS INFO
// ===========================================

export const BUSINESS_ADDRESS = "750 Terrado Plaza, Suite 33, Covina, CA 91723";

// ===========================================
// RETRY CONFIG
// ===========================================

/** Maximum number of send attempts per email */
export const MAX_RETRY_ATTEMPTS = 3;

/** Base delay between retries in ms (multiplied by attempt number) */
export const RETRY_BASE_DELAY_MS = 10_000;

/**
 * Hard ceiling on ONE attempt's request to Resend.
 *
 * Without it a `sendEmail` call has no upper bound at all — only the backoff
 * sleeps are bounded, so worst case is `30s of sleeps + 3 × (unbounded
 * latency)`. That can outlive a Vercel invocation, which kills it mid-loop:
 * for the route-day cron that means no summary line, i.e. no way to tell a
 * truncated run from a complete one.
 *
 * DELIBERATELY GENEROUS, because aborting is not free. A timed-out attempt may
 * still have been ACCEPTED by Resend, and the retry reuses the same request —
 * so for a caller that passes an `idempotencyKey` the retry is deduped, but for
 * one that does NOT, an abort-then-retry can send the customer two copies.
 * 15s is far above Resend's normal sub-second response, so only a genuinely
 * stuck request trips it; shaving this to squeeze a cron budget would trade a
 * rare missing log line for real duplicate mail.
 *
 * Callers whose sends ARE key-protected can pass a tighter
 * `attemptTimeoutMs` — see SendEmailOptions.
 */
export const SEND_ATTEMPT_TIMEOUT_MS = 15_000;

// ===========================================
// ERROR GUIDANCE (operator-friendly messages)
// ===========================================

export const ERROR_GUIDANCE: Record<string, { label: string; guidance: string }> = {
  bounced: {
    label: "Bounced",
    guidance: "Bad email address — contact customer for correct email",
  },
  complained: {
    label: "Spam Report",
    guidance: "Customer marked as spam — do not resend, contact directly",
  },
  timeout: {
    label: "Timeout",
    guidance: "Temporary issue — safe to retry",
  },
  rate_limit: {
    label: "Rate Limited",
    guidance: "Too many emails — wait 1 hour then retry",
  },
  invalid_address: {
    label: "Invalid Address",
    guidance: "Email format invalid — verify with customer",
  },
  unknown: {
    label: "Unknown Error",
    guidance: "Check error details — may need developer review",
  },
};
