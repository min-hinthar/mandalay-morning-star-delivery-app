import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";
import type { RouteStats, RouteStatus } from "@/types/driver";

// ============================================
// TYPES
// ============================================

export interface RouteProgressItem {
  id: string;
  status: RouteStatus;
  driver_name: string | null;
  stats_json: RouteStats | null;
  started_at: string | null;
  delivery_date: string;
}

// ============================================
// GET /api/admin/ops/routes-progress
// ============================================

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: auth.userId,
      role: "admin",
      route: "admin/ops/routes-progress",
    });
    if (rl.limited) return rl.response;

    const { supabase } = auth;

    // Today's date in YYYY-MM-DD format (server timezone)
    const today = new Date().toISOString().split("T")[0];

    // Query today's non-completed, non-planned routes with driver name
    // !inner JOIN excludes routes without a driver (shouldn't happen for non-planned)
    const { data: routes, error } = await supabase
      .from("routes")
      .select(
        `
        id,
        status,
        stats_json,
        started_at,
        delivery_date,
        drivers!inner(
          profiles!inner(full_name)
        )
      `
      )
      .eq("delivery_date", today)
      .neq("status", "completed")
      .neq("status", "planned");

    if (error) {
      logger.exception(error, {
        api: "admin/ops/routes-progress",
        flowId: "fetch",
        userId: auth.userId,
      });
      return NextResponse.json(
        { error: "Failed to fetch route progress" },
        { status: 500 }
      );
    }

    // Transform to flat response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: RouteProgressItem[] = (routes || []).map((r: any) => ({
      id: r.id,
      status: r.status,
      driver_name: r.drivers?.profiles?.full_name ?? null,
      stats_json: r.stats_json,
      started_at: r.started_at,
      delivery_date: r.delivery_date,
    }));

    return NextResponse.json(result);
  } catch (error) {
    logger.exception(error, {
      api: "admin/ops/routes-progress",
      flowId: "fetch",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
