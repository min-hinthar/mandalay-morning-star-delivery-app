/**
 * Analytics MV Refresh Cron
 *
 * Scheduled refresh of driver_stats_mv + delivery_metrics_mv via the
 * SECURITY DEFINER refresh_analytics_views() RPC (service_role admitted by
 * 20260806001000). The admin dashboard routes still refresh inline on load
 * (kept as a freshness fallback — refresh is idempotent); this cron is what
 * keeps the [driverId] detail route honest, since that route reads the MVs
 * WITHOUT refreshing and otherwise serves numbers frozen at the last
 * dashboard visit.
 *
 * Failure returns 500 so the Vercel cron dashboard shows red (never swallow
 * into 200 — the repo webhook/cron rule); the next scheduled run self-heals.
 */
import { NextResponse } from "next/server";

import { createServiceClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/utils/api-error";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, webhookLimiter, getClientIp } from "@/lib/rate-limit";

const CRON_SECRET = process.env.CRON_SECRET;
const FLOW_ID = "refresh-analytics";

function isAuthorized(request: Request): boolean {
  if (!CRON_SECRET) {
    logger.error("CRON_SECRET is not configured — rejecting cron request", {
      flowId: FLOW_ID,
      api: "cron",
    });
    return false;
  }
  return request.headers.get("authorization") === `Bearer ${CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return apiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  const rl = await checkRateLimit({
    limiter: webhookLimiter,
    identifier: getClientIp(request),
    role: "anon",
    route: "cron/refresh-analytics",
  });
  if (rl.limited) return rl.response;

  const supabase = createServiceClient();
  const startedAt = Date.now();

  const { error } = await supabase.rpc("refresh_analytics_views");

  if (error) {
    logger.exception(error, { flowId: FLOW_ID, api: "cron" });
    return apiError("INTERNAL_ERROR", "Failed to refresh analytics views", 500);
  }

  return NextResponse.json({ refreshed: true, durationMs: Date.now() - startedAt });
}
