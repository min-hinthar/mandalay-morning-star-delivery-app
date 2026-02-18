/**
 * Rate limit identifier extraction utilities.
 * IP extraction uses x-forwarded-for / x-real-ip headers (NOT request.ip,
 * which is undefined in Node.js route handlers on Vercel).
 */
import { headers } from "next/headers";

/**
 * Extract client IP from request headers.
 * Works in API route handlers where request.ip is undefined.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

/**
 * Extract client IP in Server Actions where there is no Request object.
 * Uses next/headers to access the same forwarding headers.
 */
export async function getServerActionIp(): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = headerStore.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

/**
 * Get rate limit identifier: prefer userId, fallback to IP.
 */
export function getIdentifier(request: Request, userId?: string): string {
  return userId || getClientIp(request);
}
