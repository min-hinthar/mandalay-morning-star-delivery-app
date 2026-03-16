import { NextRequest, NextResponse } from "next/server";
import { requireDriver } from "@/lib/auth";
import { checkRateLimit, driverActionLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/utils/logger";

interface RouteParams {
  params: Promise<{ routeId: string }>;
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

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { routeId } = await params;

    const auth = await requireDriver();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, driverId } = auth;

    const rl = await checkRateLimit({
      limiter: driverActionLimiter,
      identifier: driverId,
      role: "driver",
      route: "driver/routes/[routeId]/start",
    });
    if (rl.limited) return rl.response;

    // Get route
    const { data: route, error: routeError } = await supabase
      .from("routes")
      .select("id, status, driver_id")
      .eq("id", routeId)
      .returns<RouteQueryResult[]>()
      .single();

    if (routeError || !route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    // Verify driver owns this route
    if (route.driver_id !== driverId) {
      return NextResponse.json({ error: "Not authorized to start this route" }, { status: 403 });
    }

    // Check route can be started (planned or accepted)
    if (route.status !== "planned" && route.status !== "accepted") {
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
      logger.exception(updateError, { api: "driver/routes/[routeId]/start", routeId, driverId });
      return NextResponse.json({ error: "Failed to start route" }, { status: 500 });
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
      await supabase.from("route_stops").update({ status: "enroute" }).eq("id", firstStop.id);
    }

    // Batch-transition all route orders to out_for_delivery
    const { data: routeStops } = await supabase
      .from("route_stops")
      .select("order_id")
      .eq("route_id", routeId);

    const orderIds = routeStops?.map((s) => s.order_id) ?? [];

    if (orderIds.length > 0) {
      const { data: updatedOrders, error: orderUpdateError } = await supabase
        .from("orders")
        .update({ status: "out_for_delivery" })
        .in("id", orderIds)
        .in("status", ["confirmed", "preparing"])
        .select("id");

      if (orderUpdateError) {
        logger.warn("Failed to batch-update orders to out_for_delivery", {
          api: "driver/routes/[routeId]/start",
          routeId,
          error: orderUpdateError.message,
        });
      } else {
        logger.info("Orders transitioned to out_for_delivery", {
          api: "driver/routes/[routeId]/start",
          routeId,
          count: updatedOrders?.length ?? 0,
        });
      }
    }

    return NextResponse.json({
      success: true,
      startedAt,
      firstStopId: firstStop?.id ?? null,
      ordersTransitioned: orderIds.length,
    });
  } catch (error) {
    logger.exception(error, { api: "driver/routes/[routeId]/start" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
