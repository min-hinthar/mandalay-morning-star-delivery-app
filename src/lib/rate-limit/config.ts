/**
 * Rate limit configuration driven by environment variables.
 * All values have sensible defaults. Override via env vars to tune without redeploy.
 */

export type RateLimitTier =
  | "auth-signin"
  | "auth-signup"
  | "api-write"
  | "public-read"
  | "driver-location"
  | "driver-action"
  | "customer"
  | "admin"
  | "global";

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  max: number;
  /** Window duration string (e.g., "1 m", "1 h", "30 s") */
  window: string;
}

function envInt(key: string, fallback: number): number {
  const val = process.env[key];
  if (!val) return fallback;
  const parsed = parseInt(val, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function envStr(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

/**
 * Rate limit configuration per tier.
 * Reads from RATE_LIMIT_* env vars with sensible defaults.
 */
export const RATE_LIMITS: Record<RateLimitTier, RateLimitConfig> = {
  "auth-signin": {
    max: envInt("RATE_LIMIT_AUTH_SIGNIN_MAX", 5),
    window: envStr("RATE_LIMIT_AUTH_SIGNIN_WINDOW", "1 m"),
  },
  "auth-signup": {
    max: envInt("RATE_LIMIT_AUTH_SIGNUP_MAX", 3),
    window: envStr("RATE_LIMIT_AUTH_SIGNUP_WINDOW", "1 h"),
  },
  "api-write": {
    max: envInt("RATE_LIMIT_API_WRITE_MAX", 10),
    window: envStr("RATE_LIMIT_API_WRITE_WINDOW", "1 m"),
  },
  "public-read": {
    max: envInt("RATE_LIMIT_PUBLIC_READ_MAX", 60),
    window: envStr("RATE_LIMIT_PUBLIC_READ_WINDOW", "1 m"),
  },
  "driver-location": {
    max: envInt("RATE_LIMIT_DRIVER_LOCATION_MAX", 2),
    window: envStr("RATE_LIMIT_DRIVER_LOCATION_WINDOW", "1 m"),
  },
  "driver-action": {
    max: envInt("RATE_LIMIT_DRIVER_ACTION_MAX", 10),
    window: envStr("RATE_LIMIT_DRIVER_ACTION_WINDOW", "1 m"),
  },
  customer: {
    max: envInt("RATE_LIMIT_CUSTOMER_MAX", 30),
    window: envStr("RATE_LIMIT_CUSTOMER_WINDOW", "1 m"),
  },
  admin: {
    max: envInt("RATE_LIMIT_ADMIN_MAX", 120),
    window: envStr("RATE_LIMIT_ADMIN_WINDOW", "1 m"),
  },
  global: {
    max: envInt("RATE_LIMIT_GLOBAL_IP_MAX", 120),
    window: envStr("RATE_LIMIT_GLOBAL_IP_WINDOW", "1 m"),
  },
};
