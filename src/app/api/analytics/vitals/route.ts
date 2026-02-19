import { NextResponse } from "next/server";
import { checkRateLimit, publicReadLimiter, getClientIp } from "@/lib/rate-limit";

/**
 * Web Vitals Analytics Endpoint
 *
 * Receives Core Web Vitals metrics from the client via sendBeacon.
 * In production, you would typically forward these to an analytics service
 * like Sentry, Vercel Analytics, or your own data warehouse.
 */

interface VitalsPayload {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  id: string;
  navigationType?: string;
  url: string;
  timestamp: number;
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = await checkRateLimit({
      limiter: publicReadLimiter,
      identifier: ip,
      role: "anon",
      route: "analytics/vitals",
    });
    if (rl.limited) return rl.response;

    const payload: VitalsPayload = await request.json();

    // Validate required fields
    if (!payload.name || typeof payload.value !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // In production, forward to analytics service
    // For now, we just acknowledge receipt
    // Example integrations:
    // - Sentry: already handled client-side in web-vitals.tsx
    // - Vercel Analytics: handled automatically with @vercel/analytics
    // - Custom: forward to your data warehouse here

    // Log in development for debugging
    if (process.env.NODE_ENV === "development") {
      console.log("[Vitals API]", payload.name, payload.value, payload.rating);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to process vitals" }, { status: 500 });
  }
}
