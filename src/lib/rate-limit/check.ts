/**
 * Rate limit check wrapper with logging, headers, and 429 response generation.
 * Returns a discriminated union so callers can branch on `limited`.
 *
 * H-05: In-memory fallback when Redis is unavailable (unconfigured or
 * erroring). The fallback is PER-TIER: it uses the tier's own window and
 * min(tier max, FALLBACK_CEILING) requests, so strict tiers (checkout 3/m,
 * feedback-anon 3/10m, auth-signin 5/m) keep their real limits in fallback
 * instead of loosening to a shared 15/min, while loose tiers (admin 120/m)
 * stay clamped at the ceiling — the in-memory Map is per serverless
 * instance, so allowing a loose tier's full budget would multiply it by the
 * warm-instance count. Nothing fails closed; fallback degrades to these
 * in-memory limits.
 */
import { NextResponse } from "next/server";

import { logger } from "@/lib/utils/logger";

import type { AppRateLimiter } from "./client";

// ---- In-memory fallback rate limiter (H-05) ----
const inMemoryBuckets = new Map<string, { count: number; resetAt: number }>();
const FALLBACK_WINDOW_MS = 60_000; // generic window when no tier is known
const FALLBACK_CEILING = 15; // never allow MORE than this per window in fallback

interface FallbackVerdict {
  limited: boolean;
  retryAfterSeconds: number;
}

function inMemoryRateLimit(key: string, max: number, windowMs: number): FallbackVerdict {
  const now = Date.now();
  const bucket = inMemoryBuckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    inMemoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: max < 1, retryAfterSeconds: Math.max(1, Math.ceil(windowMs / 1000)) };
  }

  bucket.count++;
  return {
    limited: bucket.count > max,
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

/**
 * Resolve the fallback bucket parameters for a limiter. Tier-tagged limiters
 * get their own window + clamped max, keyed by TIER (mirroring the Redis
 * `rl:<tier>` semantics so multi-route tiers share one bucket); a null
 * limiter falls back to the generic per-route 15/min bucket.
 */
function fallbackParams(
  limiter: AppRateLimiter | null,
  identifier: string,
  route: string
): { key: string; max: number; windowMs: number } {
  if (!limiter) {
    return { key: `${route}:${identifier}`, max: FALLBACK_CEILING, windowMs: FALLBACK_WINDOW_MS };
  }
  return {
    key: `${limiter.tier}:${identifier}`,
    max: Math.min(limiter.max, FALLBACK_CEILING),
    windowMs: limiter.windowMs,
  };
}

// Periodic cleanup to prevent memory leak (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of inMemoryBuckets) {
      if (now > bucket.resetAt) inMemoryBuckets.delete(key);
    }
  }, 5 * 60_000);
}

export type UserRole = "customer" | "driver" | "admin" | "anon";

export interface RateLimitOptions {
  limiter: AppRateLimiter | null;
  identifier: string;
  role: UserRole;
  route: string;
}

export type RateLimitResult =
  | { limited: true; response: NextResponse }
  | { limited: false; headers: Record<string, string> };

function rateLimited429(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: { code: "RATE_LIMITED", message: "Too many requests. Please wait a moment." } },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}

/**
 * Check rate limit for an API route handler.
 * Returns a typed discriminated union:
 * - `{ limited: true, response }` -- return the response immediately
 * - `{ limited: false, headers }` -- append headers to your response
 *
 * Falls back to a per-tier in-memory limiter when Redis is unavailable
 * (fallback success returns empty headers, so callers can detect it).
 */
export async function checkRateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const redisLimiter = opts.limiter?.redis ?? null;

  if (!redisLimiter) {
    // H-05: Fall back to in-memory limiter when Redis is not configured
    const fb = fallbackParams(opts.limiter, opts.identifier, opts.route);
    const verdict = inMemoryRateLimit(fb.key, fb.max, fb.windowMs);
    if (verdict.limited) {
      logger.warn("In-memory rate limit exceeded (Redis unavailable)", {
        api: opts.route,
        flowId: "rate-limit-fallback",
        role: opts.role,
      });
      return { limited: true, response: rateLimited429(verdict.retryAfterSeconds) };
    }
    return { limited: false, headers: {} };
  }

  let result: Awaited<ReturnType<NonNullable<AppRateLimiter["redis"]>["limit"]>>;
  try {
    result = await redisLimiter.limit(opts.identifier);
  } catch (err) {
    // H-05: Redis timeout/error — use in-memory fallback instead of failing open
    logger.error("Redis rate limiter error, falling back to in-memory", {
      api: opts.route,
      flowId: "rate-limit-fallback",
      error: err instanceof Error ? err.message : "unknown",
    });
    const fb = fallbackParams(opts.limiter, opts.identifier, opts.route);
    const verdict = inMemoryRateLimit(fb.key, fb.max, fb.windowMs);
    if (verdict.limited) {
      return { limited: true, response: rateLimited429(verdict.retryAfterSeconds) };
    }
    return { limited: false, headers: {} };
  }

  if (!result.success) {
    const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));

    logger.warn("Rate limit exceeded", {
      api: opts.route,
      flowId: "rate-limit",
      role: opts.role,
      identifier: opts.identifier.substring(0, 8) + "...",
    });

    return {
      limited: true,
      response: NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests. Please wait a moment.",
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSeconds),
            "X-RateLimit-Limit": String(result.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(result.reset),
          },
        }
      ),
    };
  }

  return {
    limited: false,
    headers: {
      "X-RateLimit-Limit": String(result.limit),
      "X-RateLimit-Remaining": String(result.remaining),
      "X-RateLimit-Reset": String(result.reset),
    },
  };
}

export interface ServerActionRateLimitResult {
  limited: boolean;
  retryAfterSeconds?: number;
}

/**
 * Check rate limit for Server Actions (returns plain object, not NextResponse).
 * Simplified version for use where you can't return an HTTP response directly.
 */
export async function checkServerActionRateLimit(opts: {
  limiter: AppRateLimiter | null;
  identifier: string;
  role: UserRole;
  route: string;
}): Promise<ServerActionRateLimitResult> {
  const redisLimiter = opts.limiter?.redis ?? null;

  if (!redisLimiter) {
    // H-05: In-memory fallback when Redis is not configured
    const fb = fallbackParams(opts.limiter, opts.identifier, opts.route);
    const verdict = inMemoryRateLimit(fb.key, fb.max, fb.windowMs);
    if (verdict.limited) {
      logger.warn("In-memory rate limit exceeded (Server Action)", {
        api: opts.route,
        flowId: "rate-limit-fallback",
        role: opts.role,
      });
      return { limited: true, retryAfterSeconds: verdict.retryAfterSeconds };
    }
    return { limited: false };
  }

  try {
    const result = await redisLimiter.limit(opts.identifier);
    if (!result.success) {
      const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
      logger.warn("Rate limit exceeded (Server Action)", {
        api: opts.route,
        flowId: "rate-limit",
        role: opts.role,
        identifier: opts.identifier.substring(0, 8) + "...",
      });
      return { limited: true, retryAfterSeconds };
    }
    return { limited: false };
  } catch (err) {
    // H-05: Redis timeout/error -- use in-memory fallback
    logger.error("Redis rate limiter error (Server Action)", {
      api: opts.route,
      flowId: "rate-limit-fallback",
      error: err instanceof Error ? err.message : "unknown",
    });
    const fb = fallbackParams(opts.limiter, opts.identifier, opts.route);
    const verdict = inMemoryRateLimit(fb.key, fb.max, fb.windowMs);
    if (verdict.limited) {
      return { limited: true, retryAfterSeconds: verdict.retryAfterSeconds };
    }
    return { limited: false };
  }
}
