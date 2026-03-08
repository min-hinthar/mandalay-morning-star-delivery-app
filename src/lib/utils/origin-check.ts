import { NextResponse } from "next/server";

/**
 * Validate Origin header on critical mutation endpoints.
 * Uses Host header comparison — reliable across custom domains and Vercel previews.
 * Returns null if valid, NextResponse if rejected.
 */
export function checkOrigin(request: Request): NextResponse | null {
  // Skip in development
  if (process.env.NODE_ENV === "development") return null;

  const origin = request.headers.get("origin");

  // No Origin header — likely server-to-server (webhooks, cron). Allow.
  if (!origin) return null;

  // Primary check: Origin host must match the request Host header
  const host = request.headers.get("host") || request.headers.get("x-forwarded-host");
  if (host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) return null;
    } catch {
      // Malformed origin — fall through to reject
    }
  }

  // Fallback: check against configured URLs
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      if (new URL(appUrl).origin === origin) return null;
    } catch {
      // Malformed APP_URL — skip
    }
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && origin === `https://${vercelUrl}`) return null;

  return NextResponse.json(
    { error: { code: "FORBIDDEN", message: "Invalid origin" } },
    { status: 403 }
  );
}
