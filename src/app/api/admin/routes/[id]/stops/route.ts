import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addStopsSchema, updateStopStatusSchema } from "@/lib/validations/route";
import { logger } from "@/lib/utils/logger";
import type { ProfileRole } from "@/types/database";
import type { RouteStopStatus } from "@/types/driver";

interface ProfileCheck {
  role: ProfileRole;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/routes/[id]/stops
 * Add orders to an existing route
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: routeId } = await params;
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
    const result = addStopsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { orderIds } = result.data;

    // Verify route exists and is in planned status
    const { data: route, error: routeError } = await supabase
      .from("routes")
      .select("id, status")
      .eq("id", routeId)
      .single();

    if (routeError || !route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    if (route.status !== "planned") {
      return NextResponse.json(
        { error: "Can only add stops to planned routes" },
        { status: 400 }
      );
    }

    // Get current max stop_index
    const { data: existingStops } = await supabase
      .from("route_stops")
      .select("stop_index")
      .eq("route_id", routeId)
      .order("stop_index", { ascending: false })
      .limit(1)
      .returns<{ stop_index: number }[]>();

    const maxIndex = existingStops?.[0]?.stop_index ?? -1;

    // Verify orders exist and are in valid status
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, status")
      .in("id", orderIds);

    if (ordersError) {
      logger.exception(ordersError, { api: "admin/routes/[id]/stops", flowId: "verify-orders" });
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

    // Check if orders are already assigned to this route
    const { data: existingAssignments } = await supabase
      .from("route_stops")
      .select("order_id")
      .eq("route_id", routeId)
      .in("order_id", orderIds);

    if (existingAssignments && existingAssignments.length > 0) {
      return NextResponse.json(
        {
          error: "Some orders are already in this route",
          existingOrderIds: existingAssignments.map((s) => s.order_id),
        },
        { status: 400 }
      );
    }

    // Create new stops
    const newStops = orderIds.map((orderId, index) => ({
      route_id: routeId,
      order_id: orderId,
      stop_index: maxIndex + 1 + index,
      status: "pending" as const,
    }));

    const { error: insertError } = await supabase
      .from("route_stops")
      .insert(newStops);

    if (insertError) {
      logger.exception(insertError, { api: "admin/routes/[id]/stops", flowId: "add-stops" });
      return NextResponse.json(
        { error: "Failed to add stops" },
        { status: 500 }
      );
    }

    // Update route stats
    const { data: allStops } = await supabase
      .from("route_stops")
      .select("status")
      .eq("route_id", routeId)
      .returns<{ status: string }[]>();

    if (allStops) {
      const stats = {
        total_stops: allStops.length,
        pending_stops: allStops.filter((s) => s.status === "pending").length,
        delivered_stops: allStops.filter((s) => s.status === "delivered").length,
        skipped_stops: allStops.filter((s) => s.status === "skipped").length,
        completion_rate: Math.round(
          (allStops.filter((s) => s.status === "delivered").length / allStops.length) * 100
        ),
      };

      await supabase
        .from("routes")
        .update({ stats_json: stats })
        .eq("id", routeId);
    }

    return NextResponse.json({
      routeId,
      addedCount: orderIds.length,
      message: "Stops added successfully",
    }, { status: 201 });
  } catch (error) {
    logger.exception(error, { api: "admin/routes/[id]/stops" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/routes/[id]/stops
 * Update a specific stop (via query param ?stopId=xxx)
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: routeId } = await params;
    const { searchParams } = new URL(request.url);
    const stopId = searchParams.get("stopId");

    if (!stopId) {
      return NextResponse.json(
        { error: "Stop ID required in query params" },
        { status: 400 }
      );
    }

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
    const result = updateStopStatusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { status, deliveryNotes } = result.data;
    const stopUpdate: Record<string, unknown> = {
      status: status as RouteStopStatus,
    };

    // Set timestamps based on status
    if (status === "arrived") {
      stopUpdate.arrived_at = new Date().toISOString();
    } else if (status === "delivered") {
      stopUpdate.delivered_at = new Date().toISOString();
    }

    if (deliveryNotes !== undefined) {
      stopUpdate.delivery_notes = deliveryNotes;
    }

    const { data: updatedStop, error: updateError } = await supabase
      .from("route_stops")
      .update(stopUpdate)
      .eq("id", stopId)
      .eq("route_id", routeId)
      .select("id, order_id, status")
      .returns<{ id: string; order_id: string; status: string }[]>()
      .single();

    if (updateError) {
      logger.exception(updateError, { api: "admin/routes/[id]/stops", flowId: "update-stop" });
      return NextResponse.json(
        { error: "Failed to update stop" },
        { status: 500 }
      );
    }

    // Update order status if delivered
    if (status === "delivered" && updatedStop?.order_id) {
      await supabase
        .from("orders")
        .update({
          status: "delivered",
          delivered_at: new Date().toISOString(),
        })
        .eq("id", updatedStop.order_id);
    }

    // Update route stats
    const { data: allStops } = await supabase
      .from("route_stops")
      .select("status")
      .eq("route_id", routeId)
      .returns<{ status: string }[]>();

    if (allStops) {
      const stats = {
        total_stops: allStops.length,
        pending_stops: allStops.filter((s) => s.status === "pending").length,
        delivered_stops: allStops.filter((s) => s.status === "delivered").length,
        skipped_stops: allStops.filter((s) => s.status === "skipped").length,
        completion_rate: Math.round(
          (allStops.filter((s) => s.status === "delivered").length / allStops.length) * 100
        ),
      };

      await supabase
        .from("routes")
        .update({ stats_json: stats })
        .eq("id", routeId);
    }

    return NextResponse.json({
      stopId,
      status: updatedStop.status,
      message: "Stop updated successfully",
    });
  } catch (error) {
    logger.exception(error, { api: "admin/routes/[id]/stops" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/routes/[id]/stops
 * Remove a stop from route (via query param ?stopId=xxx)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: routeId } = await params;
    const { searchParams } = new URL(request.url);
    const stopId = searchParams.get("stopId");

    if (!stopId) {
      return NextResponse.json(
        { error: "Stop ID required in query params" },
        { status: 400 }
      );
    }

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

    // Check route status
    const { data: route } = await supabase
      .from("routes")
      .select("status")
      .eq("id", routeId)
      .single();

    if (!route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    if (route.status !== "planned") {
      return NextResponse.json(
        { error: "Can only remove stops from planned routes" },
        { status: 400 }
      );
    }

    // Delete stop
    const { error: deleteError } = await supabase
      .from("route_stops")
      .delete()
      .eq("id", stopId)
      .eq("route_id", routeId);

    if (deleteError) {
      logger.exception(deleteError, { api: "admin/routes/[id]/stops", flowId: "remove-stop" });
      return NextResponse.json(
        { error: "Failed to remove stop" },
        { status: 500 }
      );
    }

    // Reindex remaining stops
    const { data: remainingStops } = await supabase
      .from("route_stops")
      .select("id")
      .eq("route_id", routeId)
      .order("stop_index", { ascending: true })
      .returns<{ id: string }[]>();

    if (remainingStops) {
      for (let i = 0; i < remainingStops.length; i++) {
        await supabase
          .from("route_stops")
          .update({ stop_index: i })
          .eq("id", remainingStops[i].id);
      }

      // Update route stats
      const { data: allStops } = await supabase
        .from("route_stops")
        .select("status")
        .eq("route_id", routeId);

      if (allStops) {
        const stats = {
          total_stops: allStops.length,
          pending_stops: allStops.filter((s) => s.status === "pending").length,
          delivered_stops: allStops.filter((s) => s.status === "delivered").length,
          skipped_stops: allStops.filter((s) => s.status === "skipped").length,
          completion_rate: allStops.length > 0
            ? Math.round((allStops.filter((s) => s.status === "delivered").length / allStops.length) * 100)
            : 0,
        };

        await supabase
          .from("routes")
          .update({ stats_json: stats })
          .eq("id", routeId);
      }
    }

    return NextResponse.json({
      stopId,
      message: "Stop removed successfully",
    });
  } catch (error) {
    logger.exception(error, { api: "admin/routes/[id]/stops" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
