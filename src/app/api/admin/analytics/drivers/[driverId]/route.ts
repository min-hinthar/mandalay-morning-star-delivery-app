import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { driverIdParamSchema } from "@/lib/validations/analytics";
import { logger } from "@/lib/utils/logger";
import { transformDriverStats } from "@/lib/utils/analytics-helpers";
import type { ProfileRole } from "@/types/database";
import type {
  DriverStatsMvRow,
  DriverAnalyticsDetailResponse,
  RecentDelivery,
  DailyMetricPoint,
  RatingTrendPoint,
  DriverRatingWithDetails,
} from "@/types/analytics";

interface ProfileCheck {
  role: ProfileRole;
}

interface RouteParams {
  params: Promise<{ driverId: string }>;
}

interface RecentDeliveryRow {
  id: string;
  order_id: string;
  delivered_at: string;
  arrived_at: string | null;
  orders: {
    id: string;
    user_id: string;
    profiles: {
      full_name: string | null;
    } | null;
    addresses: {
      line_1: string;
      city: string;
    } | null;
  };
  delivery_exceptions: Array<{
    id: string;
  }>;
}

interface RatingRow {
  id: string;
  order_id: string;
  rating: number;
  feedback_text: string | null;
  submitted_at: string;
  orders: {
    id: string;
    delivery_window_start: string | null;
    total_cents: number;
    profiles: {
      full_name: string | null;
    } | null;
  };
}

interface SimpleRatingRow {
  rating: number;
  submitted_at: string;
}

interface DeliveredAtRow {
  delivered_at: string | null;
}

interface RouteIdRow {
  id: string;
}

/**
 * GET /api/admin/analytics/drivers/[driverId]
 * Get detailed analytics for a specific driver
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const resolvedParams = await params;
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

    // Validate driver ID
    const paramResult = driverIdParamSchema.safeParse(resolvedParams);

    if (!paramResult.success) {
      return NextResponse.json(
        { error: "Invalid driver ID" },
        { status: 400 }
      );
    }

    const { driverId } = paramResult.data;

    // Fetch driver stats from materialized view
    const { data: driverStatsRow, error: statsError } = await supabase
      .from("driver_stats_mv")
      .select("*")
      .eq("driver_id", driverId)
      .returns<DriverStatsMvRow[]>()
      .single();

    if (statsError || !driverStatsRow) {
      return NextResponse.json(
        { error: "Driver not found" },
        { status: 404 }
      );
    }

    const stats = transformDriverStats(driverStatsRow);

    // Get route IDs for this driver
    const { data: driverRouteIds } = await supabase
      .from("routes")
      .select("id")
      .eq("driver_id", driverId)
      .returns<RouteIdRow[]>();

    // Fetch recent deliveries (last 20)
    const { data: recentDeliveriesData } = await supabase
      .from("route_stops")
      .select(
        `
        id,
        order_id,
        delivered_at,
        arrived_at,
        orders!inner (
          id,
          user_id,
          profiles!orders_user_id_fkey (
            full_name
          ),
          addresses (
            line_1,
            city
          )
        ),
        delivery_exceptions (
          id
        )
      `
      )
      .eq("status", "delivered")
      .in("route_id", driverRouteIds?.map((r) => r.id) || [])
      .order("delivered_at", { ascending: false })
      .limit(20)
      .returns<RecentDeliveryRow[]>();

    const recentDeliveries: RecentDelivery[] = (recentDeliveriesData || []).map(
      (d) => {
        const durationMinutes =
          d.delivered_at && d.arrived_at
            ? Math.round(
                (new Date(d.delivered_at).getTime() -
                  new Date(d.arrived_at).getTime()) /
                  60000
              )
            : null;

        return {
          id: d.id,
          orderId: d.order_id,
          deliveredAt: d.delivered_at,
          deliveryDurationMinutes: durationMinutes,
          rating: null, // Will be populated from ratings query if needed
          hasException: (d.delivery_exceptions || []).length > 0,
          customerName: d.orders?.profiles?.full_name || null,
          address: d.orders?.addresses
            ? `${d.orders.addresses.line_1}, ${d.orders.addresses.city}`
            : "N/A",
        };
      }
    );

    // Fetch rating history (aggregated by date)
    const { data: ratingsData } = await supabase
      .from("driver_ratings")
      .select("rating, submitted_at")
      .eq("driver_id", driverId)
      .order("submitted_at", { ascending: true })
      .returns<SimpleRatingRow[]>();

    // Aggregate ratings by date
    const ratingsByDate = new Map<
      string,
      { total: number; count: number }
    >();

    (ratingsData || []).forEach((r) => {
      const date = r.submitted_at.split("T")[0];
      const existing = ratingsByDate.get(date) || { total: 0, count: 0 };
      existing.total += r.rating;
      existing.count += 1;
      ratingsByDate.set(date, existing);
    });

    const ratingHistory: RatingTrendPoint[] = Array.from(
      ratingsByDate.entries()
    ).map(([date, data]) => ({
      date,
      avgRating: Math.round((data.total / data.count) * 10) / 10,
      count: data.count,
    }));

    // Fetch delivery trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get route IDs for this driver first
    const { data: routeIds } = await supabase
      .from("routes")
      .select("id")
      .eq("driver_id", driverId)
      .returns<RouteIdRow[]>();

    const { data: deliveryTrendData } = await supabase
      .from("route_stops")
      .select("delivered_at")
      .eq("status", "delivered")
      .gte("delivered_at", thirtyDaysAgo.toISOString())
      .in("route_id", routeIds?.map((r) => r.id) || [])
      .returns<DeliveredAtRow[]>();

    // Aggregate deliveries by date
    const deliveriesByDate = new Map<string, number>();

    (deliveryTrendData || []).forEach((d) => {
      if (d.delivered_at) {
        const date = d.delivered_at.split("T")[0];
        deliveriesByDate.set(date, (deliveriesByDate.get(date) || 0) + 1);
      }
    });

    const deliveryTrend: DailyMetricPoint[] = Array.from(
      deliveriesByDate.entries()
    )
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Fetch recent ratings with details
    const { data: recentRatingsData } = await supabase
      .from("driver_ratings")
      .select(
        `
        id,
        order_id,
        rating,
        feedback_text,
        submitted_at,
        orders (
          id,
          delivery_window_start,
          total_cents,
          profiles!orders_user_id_fkey (
            full_name
          )
        )
      `
      )
      .eq("driver_id", driverId)
      .order("submitted_at", { ascending: false })
      .limit(10)
      .returns<RatingRow[]>();

    const recentRatings: DriverRatingWithDetails[] = (
      recentRatingsData || []
    ).map((r) => ({
      id: r.id,
      driver_id: driverId,
      order_id: r.order_id,
      route_stop_id: null,
      rating: r.rating,
      feedback_text: r.feedback_text,
      submitted_at: r.submitted_at,
      created_at: r.submitted_at,
      order: {
        id: r.orders.id,
        delivery_window_start: r.orders.delivery_window_start,
        total_cents: r.orders.total_cents,
      },
      customer: r.orders.profiles
        ? { full_name: r.orders.profiles.full_name }
        : null,
    }));

    const response: DriverAnalyticsDetailResponse = {
      stats,
      recentDeliveries,
      ratingHistory,
      deliveryTrend,
      recentRatings,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.exception(error, { api: "admin/analytics/drivers/[driverId]" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
