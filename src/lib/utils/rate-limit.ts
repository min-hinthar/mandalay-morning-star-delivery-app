/**
 * Simple in-memory rate limiter for auth endpoints
 * For production with multiple servers, consider using Redis or Upstash
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
}

export const AUTH_RATE_LIMITS: Record<string, RateLimitConfig> = {
  signIn: { windowMs: 60 * 1000, maxAttempts: 5 }, // 5 per minute
  signUp: { windowMs: 60 * 60 * 1000, maxAttempts: 3 }, // 3 per hour
  resetPassword: { windowMs: 60 * 60 * 1000, maxAttempts: 3 }, // 3 per hour
};

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
  remaining?: number;
}

/**
 * Check if an action is rate limited
 * @param identifier - Unique identifier (e.g., email address, IP)
 * @param action - The action being rate limited (signIn, signUp, resetPassword)
 * @returns Object with allowed status and retry info
 */
export function checkRateLimit(
  identifier: string,
  action: keyof typeof AUTH_RATE_LIMITS
): RateLimitResult {
  const config = AUTH_RATE_LIMITS[action];
  if (!config) {
    return { allowed: true };
  }

  const key = `${action}:${identifier.toLowerCase()}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  // No entry or expired - allow and create new entry
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxAttempts - 1 };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxAttempts) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      retryAfterSeconds,
      remaining: 0,
    };
  }

  // Increment and allow
  entry.count++;
  return { allowed: true, remaining: config.maxAttempts - entry.count };
}

/**
 * Clean up expired entries (call periodically to prevent memory leaks)
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}
