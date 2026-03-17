import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { createRouteSchema } from "@/lib/validations/route";
import { logger } from "@/lib/utils/logger";
import type { ProfilesRow } from "@/types/database";
import type { RoutesRow, DriversRow, RouteStats } from "@/types/driver";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";
import { optimizeRouteStops } from "@/lib/services/route-optimization";
import { transformRouteForList } from "@/lib/utils/route-transformers";

interface RouteWithDriver extends RoutesRow {
  drivers:
    | (Pick<DriversRow, "id"> & {
        profiles: Pick<ProfilesRow, "full_name"> | null;
      })
    | null;
  route_stops: Array<{ id: string; status: string }>;
  declined_driver: {
    profiles: Pick<ProfilesRow, "full_name"> | null;
  } | null;
}

/**
 * GET /api/admin/routes
 * List routes with optional date filter (paginated)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { userId } = auth;
    // Use service client for complex join query (bypasses RLS, avoids 5s timeout)
    // Admin auth already verified by requireAdmin()
    const supabase = createServiceClient();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const rangeStart = (page - 1) * limit;
    const rangeEnd = rangeStart + limit - 1;

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: userId,
      role: "admin",
      route: "admin/routes",
    });
    if (rl.limited) return rl.response;

    // Build query — includes declined_by fields (requires migration 20260316)
    const fullSelect = `
        id,
        delivery_date,
        driver_id,
        status,
        optimized_polyline,
        stats_json,
        started_at,
        completed_at,
        created_at,
        updated_at,
        declined_by,
        drivers!routes_driver_id_fkey (
          id,
          profiles (
            full_name
          )
        ),
        declined_driver:drivers!routes_declined_by_fkey (
          profiles (
            full_name
          )
        ),
        route_stops (
          id,
          status
        )
      `;

    // Fallback select without declined_by (pre-migration compatibility)
    const fallbackSelect = `
        id,
        delivery_date,
        driver_id,
        status,
        optimized_polyline,
        stats_json,
        started_at,
        completed_at,
        created_at,
        updated_at,
        drivers!routes_driver_id_fkey (
          id,
          profiles (
            full_name
          )
        ),
        route_stops (
          id,
          status
        )
      `;

    async function fetchRoutes(selectStr: string) {
      let q = supabase
        .from("routes")
        .select(selectStr, { count: "exact" })
        .order("delivery_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (date) {
        q = q.eq("delivery_date", date);
      }
      return q.range(rangeStart, rangeEnd).returns<RouteWithDriver[]>();
    }

    let { data: routes, error: routesError, count } = await fetchRoutes(fullSelect);

    // Fallback if declined_by column/FK doesn't exist yet (migration not applied)
    if (routesError) {
      logger.warn("Routes query failed, retrying without declined_by fields", {
        api: "admin/routes",
        error: routesError.message,
      });
      ({ data: routes, error: routesError, count } = await fetchRoutes(fallbackSelect));
    }

    if (routesError) {
      logger.exception(routesError, { api: "admin/routes" });
      return NextResponse.json({ error: "Failed to fetch routes" }, { status: 500 });
    }

    // Transform to API response format
    const data = (routes ?? []).map(transformRouteForList);

    const total = count ?? 0;

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.exception(error, { api: "admin/routes" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/routes
 * Create a new route with stops
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
      route: "admin/routes",
    });
    if (rl.limited) return rl.response;

    // Parse and validate request body
    const body = await request.json();
    const result = createRouteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { deliveryDate, driverId, orderIds } = result.data;

    // Verify all orders exist and are in confirmed status
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, status")
      .in("id", orderIds);

    if (ordersError) {
      logger.exception(ordersError, {
        api: "admin/routes",
        flowId: "create-verify-orders",
        driverId,
        orderIds,
      });
      return NextResponse.json({ error: "Failed to verify orders" }, { status: 500 });
    }

    if (!orders || orders.length !== orderIds.length) {
      return NextResponse.json({ error: "Some orders not found" }, { status: 400 });
    }

    const invalidOrders = orders.filter(
      (o) => o.status !== "confirmed" && o.status !== "preparing"
    );
    if (invalidOrders.length > 0) {
      return NextResponse.json(
        {
          error: "Some orders are not ready for delivery",
          invalidOrderIds: invalidOrders.map((o) => o.id),
        },
        { status: 400 }
      );
    }

    // Check if orders are already assigned to other routes
    const { data: existingStops } = await supabase
      .from("route_stops")
      .select("order_id, routes!inner(status)")
      .in("order_id", orderIds)
      .neq("routes.status", "completed");

    if (existingStops && existingStops.length > 0) {
      return NextResponse.json(
        {
          error: "Some orders are already assigned to active routes",
          assignedOrderIds: existingStops.map((s) => s.order_id),
        },
        { status: 400 }
      );
    }

    // Create route
    const initialStats: RouteStats = {
      total_stops: orderIds.length,
      pending_stops: orderIds.length,
      delivered_stops: 0,
      skipped_stops: 0,
      completion_rate: 0,
    };

    const { data: newRoute, error: routeError } = await supabase
      .from("routes")
      .insert({
        delivery_date: deliveryDate,
        driver_id: driverId ?? null,
        status: "planned",
        stats_json: initialStats as unknown as import("@/types/database").Json,
      })
      .select("id, delivery_date, status")
      .returns<{ id: string; delivery_date: string; status: string }[]>()
      .single();

    if (routeError) {
      logger.exception(routeError, {
        api: "admin/routes",
        flowId: "create-route",
        driverId,
        orderIds,
      });
      return NextResponse.json({ error: "Failed to create route" }, { status: 500 });
    }

    // Create route stops
    const stops = orderIds.map((orderId, index) => ({
      route_id: newRoute.id,
      order_id: orderId,
      stop_index: index,
      status: "pending" as const,
    }));

    const { error: stopsError } = await supabase.from("route_stops").insert(stops);

    if (stopsError) {
      logger.exception(stopsError, {
        api: "admin/routes",
        flowId: "create-stops",
        routeId: newRoute.id,
        driverId,
        orderIds,
      });
      // Rollback route creation
      await supabase.from("routes").delete().eq("id", newRoute.id);
      return NextResponse.json({ error: "Failed to create route stops" }, { status: 500 });
    }

    // Auto-optimize stop order
    let optimized = false;
    let totalDurationSeconds: number | undefined;
    let totalDistanceMeters: number | undefined;
    let optimizationMethod: string | undefined;
    let timeWindowViolations: Array<{
      stopId: string;
      orderId: string;
      eta: string;
      windowEnd: string;
      minutesLate: number;
    }> = [];

    try {
      // Fetch stops with order addresses (same pattern as optimize endpoint)
      const { data: routeStops } = await supabase
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
        .eq("route_id", newRoute.id)
        .order("stop_index", { ascending: true })
        .returns<
          Array<{
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
          }>
        >();

      // Only optimize if all stops have coordinates
      const validStops = routeStops?.filter(
        (s) => s.orders?.addresses?.lat != null && s.orders?.addresses?.lng != null
      );

      if (validStops && validStops.length === routeStops?.length && validStops.length > 1) {
        const stopsForOptimization = validStops.map((stop) => ({
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

        const result = await optimizeRouteStops(newRoute.id, stopsForOptimization);

        // Batch update stop indices via RPC
        await supabase.rpc("batch_update_stop_indices", {
          p_stop_ids: result.orderedStopIds,
          p_indices: result.orderedStopIds.map((_, i) => i),
        });

        // Update route with polyline
        if (result.polyline) {
          await supabase
            .from("routes")
            .update({ optimized_polyline: result.polyline })
            .eq("id", newRoute.id);
        }

        optimized = true;
        totalDurationSeconds = result.totalDuration;
        totalDistanceMeters = result.totalDistance;
        optimizationMethod = result.method;
        timeWindowViolations = result.timeWindowViolations;
      }
    } catch (optimizeError) {
      // Don't block route creation on optimization failure
      logger.warn("Auto-optimization failed for new route", {
        api: "admin/routes",
        routeId: newRoute.id,
        error: optimizeError instanceof Error ? optimizeError.message : String(optimizeError),
      });
    }

    return NextResponse.json(
      {
        id: newRoute.id,
        deliveryDate: newRoute.delivery_date,
        status: newRoute.status,
        stopCount: orderIds.length,
        optimized,
        ...(totalDurationSeconds != null ? { totalDurationSeconds } : {}),
        ...(totalDistanceMeters != null ? { totalDistanceMeters } : {}),
        ...(optimizationMethod ? { optimizationMethod } : {}),
        ...(timeWindowViolations.length > 0 ? { timeWindowViolations } : {}),
        message: optimized
          ? timeWindowViolations.length > 0
            ? `Route created and optimized with ${timeWindowViolations.length} time window warning(s)`
            : "Route created and optimized successfully"
          : "Route created (not optimized — missing coordinates or single stop)",
      },
      { status: 201 }
    );
  } catch (error) {
    logger.exception(error, { api: "admin/routes" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
