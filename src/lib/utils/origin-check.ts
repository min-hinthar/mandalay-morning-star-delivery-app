import { NextResponse } from "next/server";

/**
 * Validate Origin header on critical mutation endpoints.
 * Rejects requests where Origin doesn't match the app URL.
 * Returns null if valid, NextResponse if rejected.
 */
export function checkOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  // Skip in development
  if (process.env.NODE_ENV === "development") return null;

  // No Origin header — likely server-to-server (webhooks, cron). Allow.
  if (!origin) return null;

  // Build set of allowed origins
  const allowed = new Set<string>();
  if (appUrl) {
    try {
      allowed.add(new URL(appUrl).origin);
    } catch {
      // Malformed APP_URL — skip rather than block all requests
    }
  }
  // Vercel auto-sets VERCEL_URL for preview deployments (no protocol)
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    allowed.add(`https://${vercelUrl}`);
  }

  // If we have allowed origins configured, validate
  if (allowed.size > 0 && !allowed.has(origin)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Invalid origin" } },
      { status: 403 }
    );
  }

  return null;
}
