import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { driverAnalyticsQuerySchema } from "@/lib/validations/analytics";
import { logger } from "@/lib/utils/logger";
import {
  transformDriverStats,
  generateLeaderboard,
} from "@/lib/utils/analytics-helpers";
import type { ProfileRole } from "@/types/database";
import type {
  DriverStatsMvRow,
  DriverAnalyticsListResponse,
  DriverTeamSummary,
} from "@/types/analytics";

interface ProfileCheck {
  role: ProfileRole;
}

/**
 * GET /api/admin/analytics/drivers
 * Get driver performance analytics with stats, leaderboard, and team summary
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .returns<ProfileCheck[]>()
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const queryResult = driverAnalyticsQuerySchema.safeParse(searchParams);

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryResult.error.issues },
        { status: 400 }
      );
    }

    const { includeInactive } = queryResult.data;

    // Refresh materialized views (in production, this would be scheduled)
    const { error: refreshError } = await supabase.rpc("refresh_analytics_views");
    if (refreshError) {
      logger.warn("Failed to refresh analytics views", { api: "admin/analytics/drivers", flowId: "refresh-views" });
      // Continue anyway - views might still have recent data
    }

    // Fetch driver stats from materialized view
    let query = supabase.from("driver_stats_mv").select("*");

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data: driverStatsRows, error: statsError } = await query.returns<
      DriverStatsMvRow[]
    >();

    if (statsError) {
      logger.exception(statsError, { api: "admin/analytics/drivers" });
      return NextResponse.json(
        { error: "Failed to fetch driver analytics" },
        { status: 500 }
      );
    }

    // Transform to API format
    const drivers = (driverStatsRows || []).map(transformDriverStats);

    // Generate leaderboard (top 10 active drivers)
    const leaderboard = generateLeaderboard(drivers, 10);

    // Calculate team summary
    const activeDrivers = drivers.filter((d) => d.isActive);
    const inactiveDrivers = drivers.filter((d) => !d.isActive);

    const avgTeamRating =
      activeDrivers.length > 0
        ? activeDrivers.reduce(
            (sum, d) => sum + (d.avgRating || 0),
            0
          ) / activeDrivers.filter((d) => d.avgRating !== null).length || null
        : null;

    const avgOnTimeRate =
      activeDrivers.length > 0
        ? activeDrivers.reduce((sum, d) => sum + d.onTimeRate, 0) /
          activeDrivers.length
        : 0;

    const totalDeliveriesThisWeek = activeDrivers.reduce(
      (sum, d) => sum + d.deliveriesLast7Days,
      0
    );

    const totalDeliveriesThisMonth = activeDrivers.reduce(
      (sum, d) => sum + d.deliveriesLast30Days,
      0
    );

    const summary: DriverTeamSummary = {
      totalActiveDrivers: activeDrivers.length,
      totalInactiveDrivers: inactiveDrivers.length,
      avgTeamRating: avgTeamRating !== null ? Math.round(avgTeamRating * 100) / 100 : null,
      avgOnTimeRate: Math.round(avgOnTimeRate * 10) / 10,
      totalDeliveriesThisWeek,
      totalDeliveriesThisMonth,
    };

    const response: DriverAnalyticsListResponse = {
      drivers,
      leaderboard,
      summary,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.exception(error, { api: "admin/analytics/drivers" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
