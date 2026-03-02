// ===========================================
// EMAIL CONSTANTS
// ===========================================

export const EMAIL_FROM =
  "Mandalay Morning Star Burmese Kitchen (Los Angeles) <admin@mandalaymorningstar.com>";

export const EMAIL_REPLY_TO = "admin@mandalaymorningstar.com";

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
