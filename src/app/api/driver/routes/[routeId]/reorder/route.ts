import { NextRequest, NextResponse } from "next/server";
import { requireDriver } from "@/lib/auth";
import { checkRateLimit, driverActionLimiter } from "@/lib/rate-limit";
import { reorderStopsSchema } from "@/lib/validations/route";
import { logger } from "@/lib/utils/logger";

interface RouteParams {
  params: Promise<{ routeId: string }>;
}

interface RouteQueryResult {
  id: string;
  status: string;
  driver_id: string;
}

interface RouteStopId {
  id: string;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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
      route: "driver/routes/[routeId]/reorder",
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
      return NextResponse.json(
        { error: "Not authorized to reorder this route" },
        { status: 403 },
      );
    }

    // Status guard: only accepted or in_progress routes can be reordered
    if (route.status !== "accepted" && route.status !== "in_progress") {
      return NextResponse.json({ error: "Route not active" }, { status: 400 });
    }

    // Parse and validate body
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = reorderStopsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid stop order", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Verify all stop IDs belong to this route
    const { data: routeStops } = await supabase
      .from("route_stops")
      .select("id")
      .eq("route_id", routeId)
      .returns<RouteStopId[]>();

    const routeStopIds = new Set(routeStops?.map((s) => s.id) ?? []);
    const allBelong = parsed.data.stopOrder.every((s) => routeStopIds.has(s.stopId));
    if (!allBelong) {
      return NextResponse.json({ error: "Invalid stop IDs" }, { status: 400 });
    }

    // Batch update stop indices via RPC
    const stopIds = parsed.data.stopOrder.map((s) => s.stopId);
    const indices = parsed.data.stopOrder.map((s) => s.stopIndex);

    const { error: rpcError } = await supabase.rpc("batch_update_stop_indices", {
      p_stop_ids: stopIds,
      p_indices: indices,
    });

    if (rpcError) {
      logger.exception(rpcError, {
        api: "driver/routes/[routeId]/reorder",
        routeId,
        driverId,
      });
      return NextResponse.json({ error: "Failed to reorder stops" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.exception(error, { api: "driver/routes/[routeId]/reorder" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
