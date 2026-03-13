import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { optimizeRouteSchema } from "@/lib/validations/route";
import { optimizeRouteStops } from "@/lib/services/route-optimization";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

interface RouteStopWithOrder {
  id: string;
  order_id: string;
  orders: {
    delivery_window_start: string | null;
    delivery_window_end: string | null;
    addresses: {
      lat: number | null;
      lng: number | null;
      line_1: string;
      city: string;
      state: string;
      postal_code: string;
    } | null;
  } | null;
}

/**
 * POST /api/admin/routes/optimize
 * Optimize a route's stop order using the route optimization service
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, userId } = auth;

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: userId,
      role: "admin",
      route: "admin/routes/optimize",
    });
    if (rl.limited) return rl.response;

    // Parse and validate request body
    const body = await request.json();
    const result = optimizeRouteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { routeId } = result.data;

    // Fetch route and stops with addresses
    const { data: route, error: routeError } = await supabase
      .from("routes")
      .select("id, status")
      .eq("id", routeId)
      .single();

    if (routeError || !route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    // Only optimize planned routes
    if (route.status !== "planned") {
      return NextResponse.json({ error: "Can only optimize planned routes" }, { status: 400 });
    }

    // Fetch stops with order addresses
    const { data: stops, error: stopsError } = await supabase
      .from("route_stops")
      .select(
        `
        id,
        order_id,
        orders (
          delivery_window_start,
          delivery_window_end,
          addresses (
            lat,
            lng,
            line_1,
            city,
            state,
            postal_code
          )
        )
      `
      )
      .eq("route_id", routeId)
      .order("stop_index", { ascending: true })
      .returns<RouteStopWithOrder[]>();

    if (stopsError) {
      logger.exception(stopsError, { api: "admin/routes/optimize", flowId: "fetch-stops" });
      return NextResponse.json({ error: "Failed to fetch route stops" }, { status: 500 });
    }

    if (!stops || stops.length === 0) {
      return NextResponse.json({ error: "Route has no stops to optimize" }, { status: 400 });
    }

    // Validate all stops have addresses with coordinates
    const stopsWithMissingCoords = stops.filter(
      (s) => s.orders?.addresses?.lat == null || s.orders?.addresses?.lng == null
    );

    if (stopsWithMissingCoords.length > 0) {
      return NextResponse.json(
        {
          error: "Some stops are missing coordinates",
          missingStopIds: stopsWithMissingCoords.map((s) => s.id),
        },
        { status: 400 }
      );
    }

    // Prepare stops for optimization
    const stopsForOptimization = stops.map((stop) => ({
      id: stop.id,
      order_id: stop.order_id,
      address: {
        lat: stop.orders!.addresses!.lat,
        lng: stop.orders!.addresses!.lng,
        line_1: stop.orders!.addresses!.line_1,
        city: stop.orders!.addresses!.city,
        state: stop.orders!.addresses!.state,
        postal_code: stop.orders!.addresses!.postal_code,
      },
      deliveryWindowStart: stop.orders?.delivery_window_start,
      deliveryWindowEnd: stop.orders?.delivery_window_end,
    }));

    // Run optimization
    let optimized;
    try {
      optimized = await optimizeRouteStops(routeId, stopsForOptimization);
    } catch (err) {
      logger.exception(err, {
        api: "admin/routes/optimize",
        flowId: "optimize",
        routeId,
        stopCount: stops.length,
      });
      return NextResponse.json(
        {
          error: "Optimization failed",
          code: "OPTIMIZE_FAILED",
          detail: err instanceof Error ? err.message : "Unknown",
        },
        { status: 500 }
      );
    }

    // Batch update stop indices via RPC
    const { error: batchError } = await supabase.rpc("batch_update_stop_indices", {
      p_stop_ids: optimized.orderedStopIds,
      p_indices: optimized.orderedStopIds.map((_, i) => i),
    });

    if (batchError) {
      logger.exception(batchError, {
        api: "admin/routes/optimize",
        flowId: "batch-update-stop-indices",
        stopCount: stops.length,
      });
      return NextResponse.json(
        {
          error: "Failed to update stop order",
          code: "BATCH_UPDATE_FAILED",
          detail: batchError.message,
        },
        { status: 500 }
      );
    }

    // Update route with optimization data
    let polylineWarning: string | undefined;
    const { error: routeUpdateError } = await supabase
      .from("routes")
      .update({
        optimized_polyline: optimized.polyline,
      })
      .eq("id", routeId);

    if (routeUpdateError) {
      logger.exception(routeUpdateError, { api: "admin/routes/optimize", flowId: "update-route" });
      polylineWarning = "Stop order updated but polyline failed to save";
    }

    return NextResponse.json({
      routeId,
      orderedStopIds: optimized.orderedStopIds,
      totalDurationSeconds: optimized.totalDuration,
      totalDistanceMeters: optimized.totalDistance,
      polyline: optimized.polyline,
      method: optimized.method,
      ...(polylineWarning ? { warning: polylineWarning } : {}),
      ...(optimized.timeWindowViolations.length > 0
        ? { timeWindowViolations: optimized.timeWindowViolations }
        : {}),
      message:
        optimized.timeWindowViolations.length > 0
          ? `Route optimized with ${optimized.timeWindowViolations.length} time window warning(s)`
          : "Route optimized successfully",
    });
  } catch (error) {
    logger.exception(error, { api: "admin/routes/optimize" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
