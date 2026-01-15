import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
}

interface StopQueryResult {
  id: string;
  stop_index: number;
}

interface StartRouteResponse {
  success: boolean;
  startedAt: string;
  firstStopId: string | null;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<StartRouteResponse | { error: string }>> {
  try {
    const { routeId } = await params;
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
      .select("id, status, driver_id")
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
        { error: "Not authorized to start this route" },
        { status: 403 }
      );
    }

    // Check route can be started
    if (route.status !== "planned") {
      return NextResponse.json(
        { error: `Cannot start route with status: ${route.status}` },
        { status: 400 }
      );
    }

    // Start the route
    const startedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("routes")
      .update({
        status: "in_progress",
        started_at: startedAt,
      })
      .eq("id", routeId);

    if (updateError) {
      console.error("Error starting route:", updateError);
      return NextResponse.json(
        { error: "Failed to start route" },
        { status: 500 }
      );
    }

    // Set first stop to "enroute"
    const { data: firstStop } = await supabase
      .from("route_stops")
      .select("id, stop_index")
      .eq("route_id", routeId)
      .order("stop_index", { ascending: true })
      .limit(1)
      .returns<StopQueryResult[]>()
      .single();

    if (firstStop) {
      await supabase
        .from("route_stops")
        .update({ status: "enroute" })
        .eq("id", firstStop.id);
    }

    return NextResponse.json({
      success: true,
      startedAt,
      firstStopId: firstStop?.id ?? null,
    });
  } catch (error) {
    console.error("Error starting route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
