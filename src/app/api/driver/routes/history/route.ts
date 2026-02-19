import { NextRequest, NextResponse } from "next/server";
import { requireDriver } from "@/lib/auth";
import { checkRateLimit, driverActionLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/utils/logger";
import type { RouteStats, RouteStatus } from "@/types/driver";

interface RouteQueryResult {
  id: string;
  delivery_date: string;
  status: string;
  stats_json: RouteStats | null;
  started_at: string | null;
  completed_at: string | null;
}

interface RouteHistoryItem {
  id: string;
  deliveryDate: string;
  status: RouteStatus;
  stopCount: number;
  deliveredCount: number;
  skippedCount: number;
  completionRate: number;
  durationMinutes: number | null;
  startedAt: string | null;
  completedAt: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireDriver();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, driverId } = auth;

    const rl = await checkRateLimit({
      limiter: driverActionLimiter,
      identifier: driverId,
      role: "driver",
      route: "driver/routes/history",
    });
    if (rl.limited) return rl.response;

    // Get driver stats
    interface DriverStatsResult {
      deliveries_count: number;
      rating_avg: number;
    }

    const { data: driverStats } = await supabase
      .from("drivers")
      .select("deliveries_count, rating_avg")
      .eq("id", driverId)
      .returns<DriverStatsResult[]>()
      .single();

    // Get limit and offset from query params
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0);

    // Get total count of completed routes
    const { count: totalCount } = await supabase
      .from("routes")
      .select("id", { count: "exact", head: true })
      .eq("driver_id", driverId)
      .eq("status", "completed");

    // Get completed routes with pagination
    const { data: routes, error: routesError } = await supabase
      .from("routes")
      .select("id, delivery_date, status, stats_json, started_at, completed_at")
      .eq("driver_id", driverId)
      .eq("status", "completed")
      .order("delivery_date", { ascending: false })
      .range(offset, offset + limit - 1)
      .returns<RouteQueryResult[]>();

    if (routesError) {
      logger.exception(routesError, { api: "driver/routes/history" });
      return NextResponse.json({ error: "Failed to fetch routes" }, { status: 500 });
    }

    // Transform routes
    const historyRoutes: RouteHistoryItem[] = (routes ?? []).map((route) => {
      const stats = route.stats_json;
      return {
        id: route.id,
        deliveryDate: route.delivery_date,
        status: route.status as RouteStatus,
        stopCount: stats?.total_stops ?? 0,
        deliveredCount: stats?.delivered_stops ?? 0,
        skippedCount: stats?.skipped_stops ?? 0,
        completionRate: stats?.completion_rate ?? 0,
        durationMinutes: stats?.total_duration_minutes ?? null,
        startedAt: route.started_at,
        completedAt: route.completed_at,
      };
    });

    return NextResponse.json({
      driver: {
        deliveriesCount: driverStats?.deliveries_count ?? 0,
        ratingAvg: driverStats?.rating_avg ?? 0,
      },
      routes: historyRoutes,
      totalRoutes: totalCount ?? 0,
    });
  } catch (error) {
    logger.exception(error, { api: "driver/routes/history" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
