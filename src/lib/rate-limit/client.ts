/**
 * Rate limiter exports.
 * Uses @upstash/ratelimit + @upstash/redis for serverless-compatible
 * sliding window rate limiting with per-tier configuration.
 *
 * When UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set,
 * all 13 limiters are functional Ratelimit instances.
 * When env vars are missing (dev), all limiters are null and
 * check.ts falls back to conservative in-memory 15 req/min.
 */
import { Ratelimit } from "@upstash/ratelimit";
import type { Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { RATE_LIMITS, type RateLimitTier } from "./config";

/** Module-scope Redis singleton -- null when env vars are missing */
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

/** Returns the shared Redis client instance, or null if not configured. */
export function getRedisClient(): Redis | null {
  return redis;
}

/**
 * Create a sliding-window rate limiter for the given tier.
 * Returns null when Redis is not configured (dev environments).
 */
function createLimiter(tier: RateLimitTier, prefix: string): Ratelimit | null {
  if (!redis) return null;
  const config = RATE_LIMITS[tier];
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.max, config.window as Duration),
    prefix: `rl:${prefix}`,
    ephemeralCache: new Map(),
    analytics: true,
  });
}

export const authSignInLimiter = createLimiter("auth-signin", "auth-signin");
export const authSignUpLimiter = createLimiter("auth-signup", "auth-signup"); // Unwired: OTP app, no discrete signup endpoint (D-11)
export const apiWriteLimiter = createLimiter("api-write", "api-write");
export const publicReadLimiter = createLimiter("public-read", "public-read");
export const driverLocationLimiter = createLimiter("driver-location", "driver-location");
export const driverActionLimiter = createLimiter("driver-action", "driver-action");
export const customerLimiter = createLimiter("customer", "customer");
export const adminLimiter = createLimiter("admin", "admin");
export const globalLimiter = createLimiter("global", "global"); // Reserved: per-IP safety net for future use (D-12)
export const checkoutLimiter = createLimiter("checkout", "checkout");
export const refundLimiter = createLimiter("refund", "refund");
export const adminBulkLimiter = createLimiter("admin-bulk", "admin-bulk"); // Unwired: no bulk admin endpoints exist (D-13)
export const webhookLimiter = createLimiter("webhook", "webhook");
