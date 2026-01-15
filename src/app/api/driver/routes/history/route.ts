import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { RouteStats, RouteStatus } from "@/types/driver";

interface DriverQueryResult {
  id: string;
  deliveries_count: number;
  rating_avg: number;
}

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

interface HistoryResponse {
  driver: {
    deliveriesCount: number;
    ratingAvg: number;
  };
  routes: RouteHistoryItem[];
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<HistoryResponse | { error: string }>> {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get driver
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("id, deliveries_count, rating_avg")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .returns<DriverQueryResult[]>()
      .single();

    if (driverError || !driver) {
      return NextResponse.json(
        { error: "Not a driver" },
        { status: 403 }
      );
    }

    // Get limit from query params (default 20)
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);

    // Get completed routes
    const { data: routes, error: routesError } = await supabase
      .from("routes")
      .select("id, delivery_date, status, stats_json, started_at, completed_at")
      .eq("driver_id", driver.id)
      .eq("status", "completed")
      .order("delivery_date", { ascending: false })
      .limit(limit)
      .returns<RouteQueryResult[]>();

    if (routesError) {
      console.error("Error fetching routes:", routesError);
      return NextResponse.json(
        { error: "Failed to fetch routes" },
        { status: 500 }
      );
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
        deliveriesCount: driver.deliveries_count,
        ratingAvg: driver.rating_avg,
      },
      routes: historyRoutes,
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
