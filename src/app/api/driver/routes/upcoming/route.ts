import { NextResponse } from "next/server";
import { requireDriver } from "@/lib/auth";
import { checkRateLimit, driverActionLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/utils/logger";
import type { RouteStats } from "@/types/driver";
import { TIMEZONE } from "@/types/delivery";

interface RouteQueryResult {
  id: string;
  delivery_date: string;
  status: string;
  stats_json: RouteStats | null;
  started_at: string | null;
}

interface StopQueryResult {
  id: string;
  status: string;
  route_id: string;
  orders: {
    addresses: {
      line_1: string;
      city: string;
    } | null;
  } | null;
}

export async function GET() {
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
      route: "driver/routes/upcoming",
    });
    if (rl.limited) return rl.response;

    // Get today's date in LA timezone
    const todayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    // Get upcoming routes (today and future)
    const { data: routes, error: routesError } = await supabase
      .from("routes")
      .select("id, delivery_date, status, stats_json, started_at")
      .eq("driver_id", driverId)
      .gte("delivery_date", todayStr)
      .in("status", ["assigned", "accepted", "planned", "in_progress"])
      .order("delivery_date", { ascending: true })
      .limit(14)
      .returns<RouteQueryResult[]>();

    if (routesError) {
      logger.exception(routesError, { api: "driver/routes/upcoming" });
      return NextResponse.json({ error: "Failed to fetch routes" }, { status: 500 });
    }

    if (!routes || routes.length === 0) {
      return NextResponse.json({ routes: [] });
    }

    // Get stops for all routes
    const routeIds = routes.map((r) => r.id);
    const { data: stops } = await supabase
      .from("route_stops")
      .select("id, status, route_id, orders(addresses(line_1, city))")
      .in("route_id", routeIds)
      .order("stop_index", { ascending: true })
      .returns<StopQueryResult[]>();

    // Group stops by route
    const stopsByRoute = new Map<string, StopQueryResult[]>();
    for (const stop of stops ?? []) {
      const existing = stopsByRoute.get(stop.route_id) ?? [];
      existing.push(stop);
      stopsByRoute.set(stop.route_id, existing);
    }

    // Transform to response
    const upcomingRoutes = routes.map((route) => {
      const routeStops = stopsByRoute.get(route.id) ?? [];
      return {
        id: route.id,
        date: route.delivery_date,
        stopCount: route.stats_json?.total_stops ?? routeStops.length,
        deliveredCount: route.stats_json?.delivered_stops ?? 0,
        onTimePercentage: route.stats_json?.completion_rate ?? 0,
        totalDurationMinutes: route.stats_json?.total_duration_minutes ?? null,
        stops: routeStops.map((stop) => ({
          id: stop.id,
          status: stop.status,
          address: stop.orders?.addresses
            ? `${stop.orders.addresses.line_1}, ${stop.orders.addresses.city}`
            : "Unknown address",
          deliveredAt: null,
        })),
      };
    });

    return NextResponse.json({ routes: upcomingRoutes });
  } catch (error) {
    logger.exception(error, { api: "driver/routes/upcoming" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
