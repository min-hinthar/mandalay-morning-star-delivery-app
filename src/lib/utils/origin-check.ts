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

  // If APP_URL is configured, validate origin matches
  if (appUrl) {
    const allowedOrigin = new URL(appUrl).origin;
    if (origin !== allowedOrigin) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Invalid origin" } },
        { status: 403 }
      );
    }
  }

  return null;
}
