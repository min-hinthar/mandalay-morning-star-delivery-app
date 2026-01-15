import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  updateStopStatusSchema,
  isValidStatusTransition,
} from "@/lib/validations/driver-api";
import type { RouteStopStatus, RouteStats } from "@/types/driver";

interface RouteParams {
  params: Promise<{ routeId: string; stopId: string }>;
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
  status: string;
  route_id: string;
  stop_index: number;
  order_id: string;
}

interface UpdateStopResponse {
  success: boolean;
  stop: {
    id: string;
    status: RouteStopStatus;
    arrivedAt: string | null;
    deliveredAt: string | null;
  };
  nextStop: {
    id: string;
    stopIndex: number;
  } | null;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<UpdateStopResponse | { error: string }>> {
  try {
    const { routeId, stopId } = await params;
    const supabase = await createClient();

    // Parse and validate request body
    const body = await request.json();
    const parseResult = updateStopStatusSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { status: newStatus, deliveryNotes } = parseResult.data;

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
        { error: "Not authorized to update this stop" },
        { status: 403 }
      );
    }

    // Verify route is in progress
    if (route.status !== "in_progress") {
      return NextResponse.json(
        { error: "Route must be in progress to update stops" },
        { status: 400 }
      );
    }

    // Get current stop
    const { data: stop, error: stopError } = await supabase
      .from("route_stops")
      .select("id, status, route_id, stop_index, order_id")
      .eq("id", stopId)
      .eq("route_id", routeId)
      .returns<StopQueryResult[]>()
      .single();

    if (stopError || !stop) {
      return NextResponse.json(
        { error: "Stop not found" },
        { status: 404 }
      );
    }

    // Validate status transition
    if (!isValidStatusTransition(stop.status, newStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from ${stop.status} to ${newStatus}` },
        { status: 400 }
      );
    }

    // Prepare update data
    const now = new Date().toISOString();
    const updateData: Record<string, string | null> = {
      status: newStatus,
    };

    if (newStatus === "arrived") {
      updateData.arrived_at = now;
    } else if (newStatus === "delivered") {
      updateData.delivered_at = now;
    }

    if (deliveryNotes) {
      updateData.delivery_notes = deliveryNotes;
    }

    // Update the stop
    const { error: updateError } = await supabase
      .from("route_stops")
      .update(updateData)
      .eq("id", stopId);

    if (updateError) {
      console.error("Error updating stop:", updateError);
      return NextResponse.json(
        { error: "Failed to update stop" },
        { status: 500 }
      );
    }

    // If delivered, update the order status
    if (newStatus === "delivered") {
      await supabase
        .from("orders")
        .update({ status: "delivered" })
        .eq("id", stop.order_id);
    }

    // Update route stats
    await updateRouteStats(supabase, routeId);

    // Find next stop if current is delivered/skipped
    let nextStop: { id: string; stopIndex: number } | null = null;
    if (newStatus === "delivered" || newStatus === "skipped") {
      const { data: nextStopData } = await supabase
        .from("route_stops")
        .select("id, stop_index")
        .eq("route_id", routeId)
        .eq("status", "pending")
        .order("stop_index", { ascending: true })
        .limit(1)
        .returns<{ id: string; stop_index: number }[]>()
        .single();

      if (nextStopData) {
        // Set next stop to enroute
        await supabase
          .from("route_stops")
          .update({ status: "enroute" })
          .eq("id", nextStopData.id);

        nextStop = {
          id: nextStopData.id,
          stopIndex: nextStopData.stop_index,
        };
      }
    }

    return NextResponse.json({
      success: true,
      stop: {
        id: stopId,
        status: newStatus as RouteStopStatus,
        arrivedAt: newStatus === "arrived" ? now : null,
        deliveredAt: newStatus === "delivered" ? now : null,
      },
      nextStop,
    });
  } catch (error) {
    console.error("Error updating stop:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function updateRouteStats(supabase: Awaited<ReturnType<typeof createClient>>, routeId: string) {
  // Get all stops for the route
  const { data: stops } = await supabase
    .from("route_stops")
    .select("status")
    .eq("route_id", routeId);

  if (!stops) return;

  const stats: RouteStats = {
    total_stops: stops.length,
    pending_stops: stops.filter(s => s.status === "pending" || s.status === "enroute").length,
    delivered_stops: stops.filter(s => s.status === "delivered").length,
    skipped_stops: stops.filter(s => s.status === "skipped").length,
    completion_rate: 0,
  };

  stats.completion_rate = stats.total_stops > 0
    ? Math.round(((stats.delivered_stops + stats.skipped_stops) / stats.total_stops) * 100)
    : 0;

  await supabase
    .from("routes")
    .update({ stats_json: stats })
    .eq("id", routeId);
}
