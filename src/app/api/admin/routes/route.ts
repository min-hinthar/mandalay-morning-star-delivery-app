import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRouteSchema } from "@/lib/validations/route";
import { logger } from "@/lib/utils/logger";
import type { ProfileRole, ProfilesRow } from "@/types/database";
import type { RoutesRow, DriversRow, RouteStats } from "@/types/driver";

interface ProfileCheck {
  role: ProfileRole;
}

interface RouteWithDriver extends RoutesRow {
  drivers: (Pick<DriversRow, "id"> & {
    profiles: Pick<ProfilesRow, "full_name"> | null;
  }) | null;
  route_stops: Array<{ id: string; status: string }>;
}

/**
 * GET /api/admin/routes
 * List routes with optional date filter
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

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

    // Build query
    let query = supabase
      .from("routes")
      .select(`
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
        drivers (
          id,
          profiles (
            full_name
          )
        ),
        route_stops (
          id,
          status
        )
      `)
      .order("delivery_date", { ascending: false })
      .order("created_at", { ascending: false });

    // Add date filter if provided
    if (date) {
      query = query.eq("delivery_date", date);
    }

    const { data: routes, error: routesError } = await query
      .limit(50)
      .returns<RouteWithDriver[]>();

    if (routesError) {
      logger.exception(routesError, { api: "admin/routes" });
      return NextResponse.json(
        { error: "Failed to fetch routes" },
        { status: 500 }
      );
    }

    // Transform to API response format
    const response = routes.map((route) => {
      const stopCount = route.route_stops?.length ?? 0;
      const deliveredCount = route.route_stops?.filter(
        (s) => s.status === "delivered"
      ).length ?? 0;

      return {
        id: route.id,
        deliveryDate: route.delivery_date,
        driver: route.drivers ? {
          id: route.drivers.id,
          fullName: route.drivers.profiles?.full_name ?? null,
        } : null,
        status: route.status,
        stopCount,
        deliveredCount,
        completionRate: stopCount > 0
          ? Math.round((deliveredCount / stopCount) * 100)
          : 0,
        createdAt: route.created_at,
      };
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.exception(error, { api: "admin/routes" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/routes
 * Create a new route with stops
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
      logger.exception(ordersError, { api: "admin/routes", flowId: "create-verify-orders" });
      return NextResponse.json(
        { error: "Failed to verify orders" },
        { status: 500 }
      );
    }

    if (!orders || orders.length !== orderIds.length) {
      return NextResponse.json(
        { error: "Some orders not found" },
        { status: 400 }
      );
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
        stats_json: initialStats,
      })
      .select("id, delivery_date, status")
      .returns<{ id: string; delivery_date: string; status: string }[]>()
      .single();

    if (routeError) {
      logger.exception(routeError, { api: "admin/routes", flowId: "create-route" });
      return NextResponse.json(
        { error: "Failed to create route" },
        { status: 500 }
      );
    }

    // Create route stops
    const stops = orderIds.map((orderId, index) => ({
      route_id: newRoute.id,
      order_id: orderId,
      stop_index: index,
      status: "pending" as const,
    }));

    const { error: stopsError } = await supabase
      .from("route_stops")
      .insert(stops);

    if (stopsError) {
      logger.exception(stopsError, { api: "admin/routes", flowId: "create-stops" });
      // Rollback route creation
      await supabase.from("routes").delete().eq("id", newRoute.id);
      return NextResponse.json(
        { error: "Failed to create route stops" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: newRoute.id,
      deliveryDate: newRoute.delivery_date,
      status: newRoute.status,
      stopCount: orderIds.length,
      message: "Route created successfully",
    }, { status: 201 });
  } catch (error) {
    logger.exception(error, { api: "admin/routes" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
