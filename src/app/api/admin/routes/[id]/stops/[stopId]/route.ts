import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateStopStatusSchema } from "@/lib/validations/route";
import { logger } from "@/lib/utils/logger";
import type { ProfileRole } from "@/types/database";
import type { RouteStopStatus } from "@/types/driver";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

interface ProfileCheck {
  role: ProfileRole;
}

interface RouteParams {
  params: Promise<{ id: string; stopId: string }>;
}

/**
 * PATCH /api/admin/routes/[id]/stops/[stopId]
 * Update individual stop status
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: routeId, stopId } = await params;
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

    const rl = await checkRateLimit({ limiter: adminLimiter, identifier: user.id, role: "admin", route: "admin/routes/:id/stops/:stopId" });
    if (rl.limited) return rl.response;

    // Parse and validate request body
    const body = await request.json();
    const result = updateStopStatusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { status, reason, deliveryNotes } = result.data;

    // Verify stop belongs to route
    const { data: stop, error: stopError } = await supabase
      .from("route_stops")
      .select("id, order_id, status")
      .eq("id", stopId)
      .eq("route_id", routeId)
      .single();

    if (stopError || !stop) {
      return NextResponse.json({ error: "Stop not found" }, { status: 404 });
    }

    // Build update object
    const stopUpdate: Record<string, unknown> = {
      status: status as RouteStopStatus,
    };

    // Set timestamps based on status
    if (status === "arrived") {
      stopUpdate.arrived_at = new Date().toISOString();
    } else if (status === "delivered") {
      stopUpdate.delivered_at = new Date().toISOString();
    }

    // Store reason in delivery_notes for skipped status or if provided
    if (status === "skipped" && reason) {
      stopUpdate.delivery_notes = `Skipped: ${reason}`;
    } else if (deliveryNotes !== undefined) {
      stopUpdate.delivery_notes = deliveryNotes;
    }

    const { data: updatedStop, error: updateError } = await supabase
      .from("route_stops")
      .update(stopUpdate)
      .eq("id", stopId)
      .eq("route_id", routeId)
      .select("id, order_id, status, arrived_at, delivered_at, delivery_notes")
      .returns<
        {
          id: string;
          order_id: string;
          status: string;
          arrived_at: string | null;
          delivered_at: string | null;
          delivery_notes: string | null;
        }[]
      >()
      .single();

    if (updateError) {
      logger.exception(updateError, {
        api: "admin/routes/[id]/stops/[stopId]",
        flowId: "update-stop",
      });
      return NextResponse.json({ error: "Failed to update stop" }, { status: 500 });
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

      await supabase.from("routes").update({ stats_json: stats }).eq("id", routeId);
    }

    return NextResponse.json({
      id: updatedStop.id,
      status: updatedStop.status,
      arrivedAt: updatedStop.arrived_at,
      deliveredAt: updatedStop.delivered_at,
      deliveryNotes: updatedStop.delivery_notes,
      message: "Stop updated successfully",
    });
  } catch (error) {
    logger.exception(error, { api: "admin/routes/[id]/stops/[stopId]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/routes/[id]/stops/[stopId]
 * Remove a stop from route (only planned routes)
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: routeId, stopId } = await params;
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

    const rl = await checkRateLimit({ limiter: adminLimiter, identifier: user.id, role: "admin", route: "admin/routes/:id/stops/:stopId" });
    if (rl.limited) return rl.response;

    // Check route status
    const { data: route, error: routeError } = await supabase
      .from("routes")
      .select("status")
      .eq("id", routeId)
      .single();

    if (routeError || !route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    if (route.status !== "planned") {
      return NextResponse.json(
        { error: "Can only remove stops from planned routes" },
        { status: 400 }
      );
    }

    // Verify stop belongs to route before deleting
    const { data: stop } = await supabase
      .from("route_stops")
      .select("id, stop_index")
      .eq("id", stopId)
      .eq("route_id", routeId)
      .single();

    if (!stop) {
      return NextResponse.json({ error: "Stop not found" }, { status: 404 });
    }

    // Delete stop
    const { error: deleteError } = await supabase
      .from("route_stops")
      .delete()
      .eq("id", stopId)
      .eq("route_id", routeId);

    if (deleteError) {
      logger.exception(deleteError, {
        api: "admin/routes/[id]/stops/[stopId]",
        flowId: "delete-stop",
      });
      return NextResponse.json({ error: "Failed to remove stop" }, { status: 500 });
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
        await supabase.from("route_stops").update({ stop_index: i }).eq("id", remainingStops[i].id);
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
          completion_rate:
            allStops.length > 0
              ? Math.round(
                  (allStops.filter((s) => s.status === "delivered").length / allStops.length) * 100
                )
              : 0,
        };

        await supabase.from("routes").update({ stats_json: stats }).eq("id", routeId);
      }
    }

    return NextResponse.json({
      id: stopId,
      message: "Stop removed successfully",
    });
  } catch (error) {
    logger.exception(error, { api: "admin/routes/[id]/stops/[stopId]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
