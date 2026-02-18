/**
 * Redis singleton and named Ratelimit instances.
 * All limiters use sliding window algorithm with fail-open timeout (3s).
 * When UPSTASH_REDIS_REST_URL is not set, all limiters are null (fail open).
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { RATE_LIMITS } from "./config";

// Singleton Redis client -- only created when env vars are set
const redis = process.env.UPSTASH_REDIS_REST_URL ? Redis.fromEnv() : null;

/** Expose singleton for health-check pings. Returns null when not configured. */
export function getRedisClient(): Redis | null {
  return redis;
}

// Shared ephemeral cache across all limiters -- reduces Redis roundtrips
const cache = new Map();

/** Timeout in ms before failing open */
const TIMEOUT_MS = 3000;

function createLimiter(prefix: string, max: number, window: string): Ratelimit | null {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    prefix,
    ephemeralCache: cache,
    timeout: TIMEOUT_MS,
    analytics: false,
  });
}

/** Auth sign-in: 5 req / 1 min (default) */
export const authSignInLimiter = createLimiter(
  "rl:auth-signin",
  RATE_LIMITS["auth-signin"].max,
  RATE_LIMITS["auth-signin"].window
);

/** Auth sign-up: 3 req / 1 hour (default) */
export const authSignUpLimiter = createLimiter(
  "rl:auth-signup",
  RATE_LIMITS["auth-signup"].max,
  RATE_LIMITS["auth-signup"].window
);

/** API write (checkout, order creation): 10 req / 1 min (default) */
export const apiWriteLimiter = createLimiter(
  "rl:api-write",
  RATE_LIMITS["api-write"].max,
  RATE_LIMITS["api-write"].window
);

/** Public read (menu, sections, search): 60 req / 1 min (default) */
export const publicReadLimiter = createLimiter(
  "rl:public-read",
  RATE_LIMITS["public-read"].max,
  RATE_LIMITS["public-read"].window
);

/** Driver location updates: 2 req / 1 min (default) */
export const driverLocationLimiter = createLimiter(
  "rl:driver-location",
  RATE_LIMITS["driver-location"].max,
  RATE_LIMITS["driver-location"].window
);

/** Driver actions (start/complete route, update stop): 10 req / 1 min (default) */
export const driverActionLimiter = createLimiter(
  "rl:driver-action",
  RATE_LIMITS["driver-action"].max,
  RATE_LIMITS["driver-action"].window
);

/** Customer CRUD (account, addresses, orders): 30 req / 1 min (default) */
export const customerLimiter = createLimiter(
  "rl:customer",
  RATE_LIMITS["customer"].max,
  RATE_LIMITS["customer"].window
);

/** Admin operations: 120 req / 1 min (default) */
export const adminLimiter = createLimiter(
  "rl:admin",
  RATE_LIMITS["admin"].max,
  RATE_LIMITS["admin"].window
);

/** Global per-IP fallback: 120 req / 1 min (default) */
export const globalLimiter = createLimiter(
  "rl:global",
  RATE_LIMITS["global"].max,
  RATE_LIMITS["global"].window
);
