/**
 * Rate limiter exports.
 * Uses @upstash/ratelimit + @upstash/redis for serverless-compatible
 * sliding window rate limiting with per-tier configuration.
 *
 * Every export is a tier-tagged AppRateLimiter. When UPSTASH_REDIS_REST_URL
 * and UPSTASH_REDIS_REST_TOKEN are set, `.redis` is a functional Ratelimit;
 * when they're missing (dev) or Redis errors at runtime, check.ts falls back
 * to an in-memory limiter that uses THIS TIER's window and
 * min(tier max, ceiling) — so strict tiers (checkout 3/m, feedback-anon
 * 3/10m) stay strict in fallback instead of loosening to a shared 15/min.
 */
import { Ratelimit } from "@upstash/ratelimit";
import type { Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { RATE_LIMITS, parseDurationMs, type RateLimitTier } from "./config";

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
 * Tier-tagged limiter. `redis` is the Upstash instance (null when Redis is
 * unconfigured); tier/max/windowMs let check.ts run a per-tier in-memory
 * fallback instead of a one-size 15/min bucket.
 */
export interface AppRateLimiter {
  redis: Ratelimit | null;
  tier: RateLimitTier;
  max: number;
  windowMs: number;
}

/** Create a tier-tagged sliding-window rate limiter. */
function createLimiter(tier: RateLimitTier, prefix: string): AppRateLimiter {
  const config = RATE_LIMITS[tier];
  return {
    redis: redis
      ? new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(config.max, config.window as Duration),
          prefix: `rl:${prefix}`,
          ephemeralCache: new Map(),
          analytics: true,
        })
      : null,
    tier,
    max: config.max,
    windowMs: parseDurationMs(config.window),
  };
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
export const feedbackAnonLimiter = createLimiter("feedback-anon", "feedback-anon");
