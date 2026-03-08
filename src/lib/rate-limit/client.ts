/**
 * Rate limiter exports.
 * Redis-based limiting disabled — all limiters are null, triggering
 * the in-memory fallback in check.ts (conservative 15 req/min per identifier).
 *
 * To re-enable: swap in an Upstash REST-compatible Redis instance and
 * restore the Ratelimit constructors.
 */
import type { Ratelimit } from "@upstash/ratelimit";

/** No Redis client configured. Returns null. */
export function getRedisClient(): null {
  return null;
}

/** All limiters are null — in-memory fallback handles rate limiting */
export const authSignInLimiter: Ratelimit | null = null;
export const authSignUpLimiter: Ratelimit | null = null;
export const apiWriteLimiter: Ratelimit | null = null;
export const publicReadLimiter: Ratelimit | null = null;
export const driverLocationLimiter: Ratelimit | null = null;
export const driverActionLimiter: Ratelimit | null = null;
export const customerLimiter: Ratelimit | null = null;
export const adminLimiter: Ratelimit | null = null;
export const globalLimiter: Ratelimit | null = null;
export const checkoutLimiter: Ratelimit | null = null;
export const refundLimiter: Ratelimit | null = null;
export const adminBulkLimiter: Ratelimit | null = null;
export const webhookLimiter: Ratelimit | null = null;
