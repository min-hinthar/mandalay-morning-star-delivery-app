import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { optimizeRouteSchema } from "@/lib/validations/route";
import { optimizeRouteStops } from "@/lib/services/route-optimization";
import { logger } from "@/lib/utils/logger";
import type { ProfileRole } from "@/types/database";

interface ProfileCheck {
  role: ProfileRole;
}

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
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

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
      return NextResponse.json(
        { error: "Can only optimize planned routes" },
        { status: 400 }
      );
    }

    // Fetch stops with order addresses
    const { data: stops, error: stopsError } = await supabase
      .from("route_stops")
      .select(`
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
      `)
      .eq("route_id", routeId)
      .order("stop_index", { ascending: true })
      .returns<RouteStopWithOrder[]>();

    if (stopsError) {
      logger.exception(stopsError, { api: "admin/routes/optimize", flowId: "fetch-stops" });
      return NextResponse.json(
        { error: "Failed to fetch route stops" },
        { status: 500 }
      );
    }

    if (!stops || stops.length === 0) {
      return NextResponse.json(
        { error: "Route has no stops to optimize" },
        { status: 400 }
      );
    }

    // Validate all stops have addresses with coordinates
    const stopsWithMissingCoords = stops.filter(
      (s) => !s.orders?.addresses?.lat || !s.orders?.addresses?.lng
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
    const optimized = await optimizeRouteStops(
      routeId,
      stopsForOptimization
    );

    // Update stop indices in database
    for (let i = 0; i < optimized.orderedStopIds.length; i++) {
      const { error: updateError } = await supabase
        .from("route_stops")
        .update({ stop_index: i })
        .eq("id", optimized.orderedStopIds[i]);

      if (updateError) {
        logger.exception(updateError, { api: "admin/routes/optimize", flowId: "update-stop-index" });
      }
    }

    // Update route with optimization data
    const { error: routeUpdateError } = await supabase
      .from("routes")
      .update({
        optimized_polyline: optimized.polyline,
      })
      .eq("id", routeId);

    if (routeUpdateError) {
      logger.exception(routeUpdateError, { api: "admin/routes/optimize", flowId: "update-route" });
    }

    return NextResponse.json({
      routeId,
      orderedStopIds: optimized.orderedStopIds,
      totalDurationSeconds: optimized.totalDuration,
      totalDistanceMeters: optimized.totalDistance,
      polyline: optimized.polyline,
      message: "Route optimized successfully",
    });
  } catch (error) {
    logger.exception(error, { api: "admin/routes/optimize" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
