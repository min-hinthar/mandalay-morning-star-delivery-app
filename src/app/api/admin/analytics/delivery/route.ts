import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deliveryMetricsQuerySchema } from "@/lib/validations/analytics";
import { logger } from "@/lib/utils/logger";
import {
  transformDeliveryMetrics,
  calculateMetricsSummary,
  generateLeaderboard,
  getDateRangeForPeriod,
  getPreviousPeriodRange,
  transformDriverStats,
} from "@/lib/utils/analytics-helpers";
import type { ProfileRole } from "@/types/database";
import type {
  DeliveryMetricsMvRow,
  DriverStatsMvRow,
  DeliveryDashboardResponse,
  PeakHoursData,
  RecentException,
} from "@/types/analytics";
import type { DeliveryExceptionType } from "@/types/driver";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

interface ProfileCheck {
  role: ProfileRole;
}

interface DeliveredAtRow {
  delivered_at: string | null;
}

interface ExceptionRow {
  id: string;
  exception_type: DeliveryExceptionType;
  description: string | null;
  created_at: string;
  resolved_at: string | null;
  route_stops: {
    id: string;
    orders: {
      id: string;
    };
    routes: {
      driver_id: string;
      drivers: {
        profiles: {
          full_name: string | null;
        } | null;
      } | null;
    };
  };
}

/**
 * GET /api/admin/analytics/delivery
 * Get delivery metrics dashboard data
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

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: user.id,
      role: "admin",
      route: "admin/analytics/delivery",
    });
    if (rl.limited) return rl.response;

    // Parse query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const queryResult = deliveryMetricsQuerySchema.safeParse(searchParams);

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryResult.error.issues },
        { status: 400 }
      );
    }

    const { period, startDate, endDate } = queryResult.data;

    // Calculate date range
    let dateStart: string;
    let dateEnd: string;

    if (startDate && endDate) {
      dateStart = startDate;
      dateEnd = endDate;
    } else {
      const range = getDateRangeForPeriod(period);
      dateStart = range.startDate.toISOString().split("T")[0];
      dateEnd = range.endDate.toISOString().split("T")[0];
    }

    // Refresh materialized views
    const { error: refreshError } = await supabase.rpc("refresh_analytics_views");
    if (refreshError) {
      logger.warn("Failed to refresh analytics views", {
        api: "admin/analytics/delivery",
        flowId: "refresh-views",
      });
    }

    // via get_delivery_metrics_admin, NOT delivery_metrics_mv directly — same
    // missing-grant problem as driver_stats_mv (see analytics/drivers/route.ts).
    // This one 500s rather than degrading, so the page was fully broken.
    const { data: metricsRows, error: metricsError } = await supabase
      .rpc("get_delivery_metrics_admin")
      .gte("delivery_date", dateStart)
      .lte("delivery_date", dateEnd)
      .order("delivery_date", { ascending: false })
      .returns<DeliveryMetricsMvRow[]>();

    if (metricsError) {
      logger.exception(metricsError, { api: "admin/analytics/delivery" });
      return NextResponse.json({ error: "Failed to fetch delivery metrics" }, { status: 500 });
    }

    const dailyMetrics = (metricsRows || []).map(transformDeliveryMetrics);

    // Fetch previous period for trend comparison
    const previousRange = getPreviousPeriodRange(period);
    const { data: previousMetricsRows, error: previousError } = await supabase
      .rpc("get_delivery_metrics_admin")
      .gte("delivery_date", previousRange.startDate.toISOString().split("T")[0])
      .lte("delivery_date", previousRange.endDate.toISOString().split("T")[0])
      .returns<DeliveryMetricsMvRow[]>();

    // A dropped error here is not cosmetic. calculateMetricsSummary leaves
    // ordersTrend/revenueTrend/successRateTrend at their initial 0 when the
    // previous period is empty, and the dashboard renders that 0 as a real
    // "0%" — so a failed read is presented to an admin as a genuinely flat
    // period. Reported rather than swallowed; the primary query above already
    // 500s on its own error, and failing the whole page over a TREND would be
    // a worse trade than showing current-period numbers without one.
    if (previousError) {
      logger.exception(previousError, {
        api: "admin/analytics/delivery",
        flowId: "previous-period-trend",
      });
    }

    const previousMetrics = (previousMetricsRows || []).map(transformDeliveryMetrics);

    // Calculate summary with trends
    const summary = calculateMetricsSummary(dailyMetrics, period, previousMetrics);

    // Calculate peak hours from route stops
    const { data: deliveriesData } = await supabase
      .from("route_stops")
      .select("delivered_at")
      .eq("status", "delivered")
      .gte("delivered_at", dateStart)
      .lte("delivered_at", dateEnd + "T23:59:59Z")
      .returns<DeliveredAtRow[]>();

    // Aggregate by hour
    const hourBuckets = new Map<number, number>();
    for (let h = 11; h <= 19; h++) {
      hourBuckets.set(h, 0);
    }

    (deliveriesData || []).forEach((d) => {
      if (d.delivered_at) {
        const hour = new Date(d.delivered_at).getHours();
        if (hour >= 11 && hour <= 19) {
          hourBuckets.set(hour, (hourBuckets.get(hour) || 0) + 1);
        }
      }
    });

    const peakHours: PeakHoursData[] = Array.from(hourBuckets.entries())
      .map(([hour, count]) => ({
        hour,
        label: `${hour > 12 ? hour - 12 : hour} ${hour >= 12 ? "PM" : "AM"}`,
        deliveryCount: count,
        avgDurationMinutes: 0, // Would need more data to calculate
      }))
      .sort((a, b) => a.hour - b.hour);

    // Fetch top drivers
    // via the wrapper, not the view — see analytics/drivers/route.ts for why.
    const { data: driverStatsRows, error: driverStatsError } = await supabase
      .rpc("get_driver_stats_admin")
      .eq("is_active", true)
      .returns<DriverStatsMvRow[]>();

    // Reported, not swallowed. Degrading to an empty Top Drivers panel rather
    // than 500-ing the whole dashboard is the right trade, but doing it
    // SILENTLY is how the missing-grant bug this PR fixes stayed hidden: the
    // read had been failing for every caller and the page just showed no
    // drivers. Now the panel still degrades, and the failure is visible.
    if (driverStatsError) {
      logger.exception(driverStatsError, {
        api: "admin/analytics/delivery",
        flowId: "top-drivers",
      });
    }

    const drivers = (driverStatsRows || []).map(transformDriverStats);
    const topDrivers = generateLeaderboard(drivers, 5);

    // Fetch recent exceptions
    const { data: exceptionsData } = await supabase
      .from("delivery_exceptions")
      .select(
        `
        id,
        exception_type,
        description,
        created_at,
        resolved_at,
        route_stops!inner (
          id,
          orders!inner (
            id
          ),
          routes!inner (
            driver_id,
            drivers!routes_driver_id_fkey (
              profiles (
                full_name
              )
            )
          )
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(10)
      .returns<ExceptionRow[]>();

    const recentExceptions: RecentException[] = (exceptionsData || []).map((e) => ({
      id: e.id,
      orderId: e.route_stops.orders.id,
      orderNumber: e.route_stops.orders.id.slice(0, 8).toUpperCase(),
      driverId: e.route_stops.routes.driver_id,
      driverName: e.route_stops.routes.drivers?.profiles?.full_name || null,
      type: e.exception_type,
      description: e.description,
      createdAt: e.created_at,
      resolved: e.resolved_at !== null,
      resolvedAt: e.resolved_at,
    }));

    const response: DeliveryDashboardResponse = {
      summary,
      dailyMetrics,
      peakHours,
      topDrivers,
      recentExceptions,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.exception(error, { api: "admin/analytics/delivery" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
