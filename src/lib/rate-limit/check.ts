/**
 * Rate limit check wrapper with logging, headers, and 429 response generation.
 * Returns a discriminated union so callers can branch on `limited`.
 *
 * H-05 FIX: In-memory fallback when Redis is unavailable.
 * Sensitive endpoints (checkout, auth) fail CLOSED during Redis outage.
 */
import { NextResponse } from "next/server";
import type { Ratelimit } from "@upstash/ratelimit";

import { logger } from "@/lib/utils/logger";

// ---- In-memory fallback rate limiter (H-05) ----
const inMemoryBuckets = new Map<string, { count: number; resetAt: number }>();
const IN_MEMORY_WINDOW_MS = 60_000; // 1 minute
const IN_MEMORY_MAX_REQUESTS = 15; // Conservative fallback limit

function inMemoryRateLimit(identifier: string): boolean {
  const now = Date.now();
  const bucket = inMemoryBuckets.get(identifier);

  if (!bucket || now > bucket.resetAt) {
    inMemoryBuckets.set(identifier, { count: 1, resetAt: now + IN_MEMORY_WINDOW_MS });
    return false; // not limited
  }

  bucket.count++;
  return bucket.count > IN_MEMORY_MAX_REQUESTS;
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
  limiter: Ratelimit | null;
  identifier: string;
  role: UserRole;
  route: string;
}

export type RateLimitResult =
  | { limited: true; response: NextResponse }
  | { limited: false; headers: Record<string, string> };

/**
 * Check rate limit for an API route handler.
 * Returns a typed discriminated union:
 * - `{ limited: true, response }` -- return the response immediately
 * - `{ limited: false, headers }` -- append headers to your response
 *
 * Fails open when limiter is null (Redis not configured) or on timeout.
 */
export async function checkRateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  if (!opts.limiter) {
    // H-05: Fall back to in-memory limiter when Redis is not configured
    const limited = inMemoryRateLimit(`${opts.route}:${opts.identifier}`);
    if (limited) {
      logger.warn("In-memory rate limit exceeded (Redis unavailable)", {
        api: opts.route,
        flowId: "rate-limit-fallback",
        role: opts.role,
      });
      return {
        limited: true,
        response: NextResponse.json(
          { error: { code: "RATE_LIMITED", message: "Too many requests. Please wait a moment." } },
          { status: 429, headers: { "Retry-After": "60" } }
        ),
      };
    }
    return { limited: false, headers: {} };
  }

  let result: Awaited<ReturnType<Ratelimit["limit"]>>;
  try {
    result = await opts.limiter.limit(opts.identifier);
  } catch (err) {
    // H-05: Redis timeout/error — use in-memory fallback instead of failing open
    logger.error("Redis rate limiter error, falling back to in-memory", {
      api: opts.route,
      flowId: "rate-limit-fallback",
      error: err instanceof Error ? err.message : "unknown",
    });
    const limited = inMemoryRateLimit(`${opts.route}:${opts.identifier}`);
    if (limited) {
      return {
        limited: true,
        response: NextResponse.json(
          { error: { code: "RATE_LIMITED", message: "Too many requests. Please wait a moment." } },
          { status: 429, headers: { "Retry-After": "60" } }
        ),
      };
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
  limiter: Ratelimit | null;
  identifier: string;
  role: UserRole;
  route: string;
}): Promise<ServerActionRateLimitResult> {
  if (!opts.limiter) {
    return { limited: false };
  }

  const result = await opts.limiter.limit(opts.identifier);

  if (!result.success) {
    const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));

    logger.warn("Rate limit exceeded", {
      api: opts.route,
      flowId: "rate-limit",
      role: opts.role,
      identifier: opts.identifier.substring(0, 8) + "...",
    });

    return { limited: true, retryAfterSeconds };
  }

  return { limited: false };
}
