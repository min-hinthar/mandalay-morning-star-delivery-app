import { NextRequest, NextResponse } from "next/server";
import { requireDriver } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, driverActionLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/utils/logger";
import { completeRouteSchema } from "@/lib/validations/driver-api";
import { checkAndAwardBadges } from "@/lib/badges";
import type { RouteStats } from "@/types/driver";

interface RouteParams {
  params: Promise<{ routeId: string }>;
}

interface RouteQueryResult {
  id: string;
  status: string;
  driver_id: string;
  stats_json: RouteStats | null;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { routeId } = await params;

    // Parse request body (optional notes for future use)
    try {
      const body = await request.json();
      // Validate schema but don't store notes - for future logging/auditing
      completeRouteSchema.safeParse(body);
    } catch {
      // Empty body is OK
    }

    const auth = await requireDriver();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, driverId } = auth;

    const rl = await checkRateLimit({
      limiter: driverActionLimiter,
      identifier: driverId,
      role: "driver",
      route: "driver/routes/[routeId]/complete",
    });
    if (rl.limited) return rl.response;

    // Get route
    const { data: route, error: routeError } = await supabase
      .from("routes")
      .select("id, status, driver_id, stats_json")
      .eq("id", routeId)
      .returns<RouteQueryResult[]>()
      .single();

    if (routeError || !route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    // Verify driver owns this route
    if (route.driver_id !== driverId) {
      return NextResponse.json({ error: "Not authorized to complete this route" }, { status: 403 });
    }

    // Check route can be completed
    if (route.status !== "in_progress") {
      return NextResponse.json(
        { error: `Cannot complete route with status: ${route.status}` },
        { status: 400 }
      );
    }

    // Calculate final stats
    const { data: stopCounts } = await supabase
      .from("route_stops")
      .select("status")
      .eq("route_id", routeId);

    const stats: RouteStats = {
      total_stops: stopCounts?.length ?? 0,
      pending_stops: stopCounts?.filter((s) => s.status === "pending").length ?? 0,
      delivered_stops: stopCounts?.filter((s) => s.status === "delivered").length ?? 0,
      skipped_stops: stopCounts?.filter((s) => s.status === "skipped").length ?? 0,
      completion_rate: 0,
      ...route.stats_json, // Preserve distance/duration if set
    };

    stats.completion_rate =
      stats.total_stops > 0 ? Math.round((stats.delivered_stops / stats.total_stops) * 100) : 0;

    // Complete the route
    const completedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("routes")
      .update({
        status: "completed",
        completed_at: completedAt,
        stats_json: stats as unknown as import("@/types/database").Json,
      })
      .eq("id", routeId);

    if (updateError) {
      logger.exception(updateError, { api: "driver/routes/[routeId]/complete", routeId, driverId });
      return NextResponse.json({ error: "Failed to complete route" }, { status: 500 });
    }

    // Driver delivery count is handled by the update_driver_deliveries_count trigger
    // (fires on route_stops status change to 'delivered')

    // Award badges based on updated stats (non-blocking)
    let newBadges: string[] = [];
    try {
      // Get updated driver stats for badge check
      const { data: driverRecord } = await supabase
        .from("drivers")
        .select("deliveries_count, rating_avg")
        .eq("id", driverId)
        .returns<{ deliveries_count: number; rating_avg: number }[]>()
        .single();

      const totalDeliveries = (driverRecord?.deliveries_count ?? 0) + stats.delivered_stops;
      const ratingAvg: number = driverRecord?.rating_avg ?? 0;

      // Get current streak
      const { data: streakData } = await supabase.rpc("calculate_driver_streak", {
        p_driver_id: driverId,
      });
      const streakDays = (streakData as number) ?? 0;

      // Check and award badges using service client (admin-only INSERT)
      const serviceClient = createServiceClient();
      newBadges = await checkAndAwardBadges(serviceClient, driverId, {
        totalDeliveries,
        streakDays,
        ratingAvg,
      });

      if (newBadges.length > 0) {
        logger.info(`Badges awarded: ${newBadges.join(", ")}`, {
          api: "driver/routes/[routeId]/complete",
          driverId,
          badges: newBadges,
        });
      }
    } catch (badgeError) {
      // Badge failure should NOT block route completion
      logger.exception(badgeError, {
        api: "driver/routes/[routeId]/complete",
        context: "badge_award",
        routeId,
        driverId,
      });
    }

    return NextResponse.json({
      success: true,
      completedAt,
      stats,
      newBadges,
    });
  } catch (error) {
    logger.exception(error, { api: "driver/routes/[routeId]/complete" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
