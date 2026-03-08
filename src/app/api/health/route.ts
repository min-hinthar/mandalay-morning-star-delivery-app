import { NextRequest, NextResponse } from "next/server";

import {
  checkEnvVars,
  runDeepChecks,
  type HealthResponse,
  type ServiceStatus,
  type StatusLevel,
} from "@/lib/health";
import { checkRateLimit, publicReadLimiter, getClientIp } from "@/lib/rate-limit";

// ===========================================
// GET /api/health - Two-tier health check
// ===========================================

/** Config-only service status based on env var presence */
function configOnlyService(configured: boolean): ServiceStatus {
  return {
    status: configured ? "healthy" : "down",
    configured,
  };
}

/** Compute worst status: healthy < degraded < down */
function worstStatus(statuses: StatusLevel[]): StatusLevel {
  if (statuses.includes("down")) return "down";
  if (statuses.includes("degraded")) return "degraded";
  return "healthy";
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit({
    limiter: publicReadLimiter,
    identifier: ip,
    role: "anon",
    route: "health",
  });
  if (rl.limited) return rl.response;

  const deep = request.nextUrl.searchParams.get("deep") === "true";

  // Always run env checks
  const envResult = checkEnvVars();

  // Config-only service status (default mode)
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  const resendConfigured = Boolean(process.env.RESEND_API_KEY);
  const googleOAuthConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const searchConsoleConfigured = Boolean(process.env.GOOGLE_SITE_VERIFICATION);
  // Redis disabled — in-memory rate limiting active. Report healthy.
  const redisConfigured = true;

  let services: HealthResponse["services"] = {
    supabase: configOnlyService(supabaseConfigured),
    stripe: configOnlyService(stripeConfigured),
    resend: configOnlyService(resendConfigured),
    google_oauth: configOnlyService(googleOAuthConfigured),
    search_console: configOnlyService(searchConsoleConfigured),
    redis: configOnlyService(redisConfigured),
  };

  let routes: HealthResponse["routes"] = {
    auth_callback: { path: "/auth/callback", reachable: true },
    stripe_webhook: { path: "/api/webhooks/stripe", reachable: true },
  };

  // Deep mode: run live connectivity checks
  if (deep) {
    const deepResult = await runDeepChecks(request.nextUrl.origin);
    services = deepResult.services;
    routes = deepResult.routes;
  }

  // Compute top-level status from all service statuses
  const allStatuses: StatusLevel[] = [
    services.supabase.status,
    services.stripe.status,
    services.resend.status,
    services.google_oauth.status,
    services.search_console.status,
    services.redis.status,
  ];
  const status = worstStatus(allStatuses);

  // production_ready requires all critical env vars AND healthy services AND reachable routes
  const allHealthy = status === "healthy";
  const allRoutesReachable = routes.auth_callback.reachable && routes.stripe_webhook.reachable;
  const productionReady = envResult.all_critical_present && allHealthy && allRoutesReachable;

  const response: HealthResponse = {
    status,
    production_ready: productionReady,
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
    environment: process.env.VERCEL_ENV ?? "development",
    services,
    routes,
    env: envResult,
  };

  return NextResponse.json(response, {
    status: allHealthy ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
