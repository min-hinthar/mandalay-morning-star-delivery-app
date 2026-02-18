/**
 * Rate limit check wrapper with logging, headers, and 429 response generation.
 * Returns a discriminated union so callers can branch on `limited`.
 */
import { NextResponse } from "next/server";
import type { Ratelimit } from "@upstash/ratelimit";

import { logger } from "@/lib/utils/logger";

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
    return { limited: false, headers: {} };
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
