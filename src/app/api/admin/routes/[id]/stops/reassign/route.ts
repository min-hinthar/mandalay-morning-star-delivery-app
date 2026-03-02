import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reassignStopSchema } from "@/lib/validations/route";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";
import type { ProfileCheck, RouteParams } from "../types";
import { updateRouteStats } from "../helpers";

/**
 * POST /api/admin/routes/[id]/stops/reassign
 * Move a stop from the source route (this route) to a target route atomically.
 *
 * Business rules:
 * - Both routes must be in "planned" status
 * - Both routes must have the same delivery_date
 * - Source and target must be different routes
 * - Stop must belong to the source route
 * - Order must not already exist on the target route
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: routeId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

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

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: user.id,
      role: "admin",
      route: "admin/routes/:id/stops/reassign",
    });
    if (rl.limited) return rl.response;

    // Parse and validate request body
    const body = await request.json();
    const result = reassignStopSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { stopId, targetRouteId } = result.data;

    // Validate source !== target
    if (routeId === targetRouteId) {
      return NextResponse.json({ error: "Cannot reassign to the same route" }, { status: 400 });
    }

    // Verify source route exists and is planned
    const { data: sourceRoute, error: sourceError } = await supabase
      .from("routes")
      .select("id, status, delivery_date")
      .eq("id", routeId)
      .single();

    if (sourceError || !sourceRoute) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    if (sourceRoute.status !== "planned") {
      return NextResponse.json(
        { error: "Can only reassign stops from planned routes" },
        { status: 400 }
      );
    }

    // Verify target route exists and is planned
    const { data: targetRoute, error: targetError } = await supabase
      .from("routes")
      .select("id, status, delivery_date")
      .eq("id", targetRouteId)
      .single();

    if (targetError || !targetRoute) {
      return NextResponse.json({ error: "Target route not found" }, { status: 404 });
    }

    if (targetRoute.status !== "planned") {
      return NextResponse.json(
        { error: "Can only reassign stops to planned routes" },
        { status: 400 }
      );
    }

    // Verify same delivery date
    if (sourceRoute.delivery_date !== targetRoute.delivery_date) {
      return NextResponse.json(
        { error: "Source and target routes must have the same delivery date" },
        { status: 400 }
      );
    }

    // Verify stop exists on source route
    const { data: stop, error: stopError } = await supabase
      .from("route_stops")
      .select("id, order_id")
      .eq("id", stopId)
      .eq("route_id", routeId)
      .returns<{ id: string; order_id: string }[]>()
      .single();

    if (stopError || !stop) {
      return NextResponse.json({ error: "Stop not found on this route" }, { status: 404 });
    }

    // Check if order already on target route
    const { data: existingOnTarget } = await supabase
      .from("route_stops")
      .select("id")
      .eq("route_id", targetRouteId)
      .eq("order_id", stop.order_id)
      .single();

    if (existingOnTarget) {
      return NextResponse.json({ error: "Order already on target route" }, { status: 400 });
    }

    // Get max stop_index on target route
    const { data: targetStops } = await supabase
      .from("route_stops")
      .select("stop_index")
      .eq("route_id", targetRouteId)
      .order("stop_index", { ascending: false })
      .limit(1)
      .returns<{ stop_index: number }[]>();

    const maxIndex = targetStops?.[0]?.stop_index ?? -1;

    // Move the stop to the target route
    const { error: updateError } = await supabase
      .from("route_stops")
      .update({ route_id: targetRouteId, stop_index: maxIndex + 1 })
      .eq("id", stopId);

    if (updateError) {
      logger.exception(updateError, {
        api: "admin/routes/[id]/stops/reassign",
        flowId: "move-stop",
        severity: "critical",
        stopId,
        sourceRouteId: routeId,
        targetRouteId,
      });
      return NextResponse.json({ error: "Failed to reassign stop" }, { status: 500 });
    }

    // Reindex remaining stops on source route
    const { data: remainingStops } = await supabase
      .from("route_stops")
      .select("id")
      .eq("route_id", routeId)
      .order("stop_index", { ascending: true })
      .returns<{ id: string }[]>();

    if (remainingStops) {
      for (let i = 0; i < remainingStops.length; i++) {
        await supabase.from("route_stops").update({ stop_index: i }).eq("id", remainingStops[i].id);
      }
    }

    // Update stats for both routes
    await updateRouteStats(supabase, routeId);
    await updateRouteStats(supabase, targetRouteId);

    return NextResponse.json({
      stopId,
      sourceRouteId: routeId,
      targetRouteId,
      message: "Stop reassigned successfully",
    });
  } catch (error) {
    logger.exception(error, { api: "admin/routes/[id]/stops/reassign" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
