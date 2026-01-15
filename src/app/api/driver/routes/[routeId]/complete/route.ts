import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { completeRouteSchema } from "@/lib/validations/driver-api";
import type { RouteStats } from "@/types/driver";

interface RouteParams {
  params: Promise<{ routeId: string }>;
}

interface DriverQueryResult {
  id: string;
}

interface RouteQueryResult {
  id: string;
  status: string;
  driver_id: string;
  stats_json: RouteStats | null;
}

interface CompleteRouteResponse {
  success: boolean;
  completedAt: string;
  stats: RouteStats | null;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<CompleteRouteResponse | { error: string }>> {
  try {
    const { routeId } = await params;
    const supabase = await createClient();

    // Parse request body (optional notes)
    let notes: string | undefined;
    try {
      const body = await request.json();
      const parsed = completeRouteSchema.safeParse(body);
      if (parsed.success) {
        notes = parsed.data.notes;
      }
    } catch {
      // Empty body is OK
    }

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
      .select("id")
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

    // Get route
    const { data: route, error: routeError } = await supabase
      .from("routes")
      .select("id, status, driver_id, stats_json")
      .eq("id", routeId)
      .returns<RouteQueryResult[]>()
      .single();

    if (routeError || !route) {
      return NextResponse.json(
        { error: "Route not found" },
        { status: 404 }
      );
    }

    // Verify driver owns this route
    if (route.driver_id !== driver.id) {
      return NextResponse.json(
        { error: "Not authorized to complete this route" },
        { status: 403 }
      );
    }

    // Check route can be completed
    if (route.status !== "in_progress") {
      return NextResponse.json(
        { error: `Cannot complete route with status: ${route.status}` },
        { status: 400 }
      );
    }

    // Calculate final stats
    interface StopCountResult {
      status: string;
      count: number;
    }

    const { data: stopCounts } = await supabase
      .from("route_stops")
      .select("status")
      .eq("route_id", routeId);

    const stats: RouteStats = {
      total_stops: stopCounts?.length ?? 0,
      pending_stops: stopCounts?.filter(s => s.status === "pending").length ?? 0,
      delivered_stops: stopCounts?.filter(s => s.status === "delivered").length ?? 0,
      skipped_stops: stopCounts?.filter(s => s.status === "skipped").length ?? 0,
      completion_rate: 0,
      ...route.stats_json, // Preserve distance/duration if set
    };

    stats.completion_rate = stats.total_stops > 0
      ? Math.round((stats.delivered_stops / stats.total_stops) * 100)
      : 0;

    // Complete the route
    const completedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("routes")
      .update({
        status: "completed",
        completed_at: completedAt,
        stats_json: stats,
      })
      .eq("id", routeId);

    if (updateError) {
      console.error("Error completing route:", updateError);
      return NextResponse.json(
        { error: "Failed to complete route" },
        { status: 500 }
      );
    }

    // Update driver's delivery count
    try {
      await supabase.rpc("increment_driver_deliveries", {
        p_driver_id: driver.id,
        p_count: stats.delivered_stops,
      });
    } catch {
      // RPC might not exist yet, ignore
      console.log("increment_driver_deliveries RPC not available, skipping");
    }

    return NextResponse.json({
      success: true,
      completedAt,
      stats,
    });
  } catch (error) {
    console.error("Error completing route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
