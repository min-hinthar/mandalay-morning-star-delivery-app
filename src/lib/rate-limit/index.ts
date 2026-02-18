/**
 * Distributed rate limiting library.
 * Uses @upstash/ratelimit + @upstash/redis for serverless-compatible
 * sliding window rate limiting with fail-open timeout.
 *
 * @example
 * import { checkRateLimit, publicReadLimiter, getClientIp } from "@/lib/rate-limit";
 *
 * const ip = getClientIp(request);
 * const rl = await checkRateLimit({ limiter: publicReadLimiter, identifier: ip, role: "anon", route: "/api/menu" });
 * if (rl.limited) return rl.response;
 */
export {
  authSignInLimiter,
  authSignUpLimiter,
  apiWriteLimiter,
  publicReadLimiter,
  driverLocationLimiter,
  driverActionLimiter,
  customerLimiter,
  adminLimiter,
  globalLimiter,
} from "./client";

export { RATE_LIMITS } from "./config";
export type { RateLimitTier, RateLimitConfig } from "./config";

export { checkRateLimit, checkServerActionRateLimit } from "./check";
export type {
  UserRole,
  RateLimitOptions,
  RateLimitResult,
  ServerActionRateLimitResult,
} from "./check";

export { getClientIp, getServerActionIp, getIdentifier } from "./identifiers";
