import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireAdmin } from "@/lib/auth";
import {
  updateRouteSchema,
  reorderStopsSchema,
  isValidRouteTransition,
  getValidRouteTransitions,
} from "@/lib/validations/route";
import { logger } from "@/lib/utils/logger";
import type { RouteStatus } from "@/types/driver";
import type { RouteParams } from "./types";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

export { GET } from "./get-handler";

/**
 * PATCH /api/admin/routes/[id]
 * Update route (assign driver, change status, reorder stops)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, userId } = auth;

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: userId,
      role: "admin",
      route: "admin/routes/:id",
    });
    if (rl.limited) return rl.response;

    const body = await request.json();

    // Check if this is a reorder request
    const reorderResult = reorderStopsSchema.safeParse(body);
    if (reorderResult.success) {
      // Check route status — reject reorder on in_progress routes unless override flag
      if (!body.forceOverride) {
        const { data: routeCheck } = await supabase
          .from("routes")
          .select("status")
          .eq("id", id)
          .single();

        if (routeCheck?.status === "in_progress") {
          return NextResponse.json(
            {
              error: "Cannot reorder stops on an in-progress route",
              hint: "Set forceOverride: true to override",
            },
            { status: 409 }
          );
        }
      }

      // Reorder stops
      const { stopOrder } = reorderResult.data;
      const submittedIds = stopOrder.map((s) => s.stopId);

      // Security: verify all submitted stopIds belong to this route
      const { data: routeStops, error: verifyError } = await supabase
        .from("route_stops")
        .select("id")
        .eq("route_id", id)
        .in("id", submittedIds);

      if (verifyError) {
        logger.exception(verifyError, {
          api: "admin/routes/[id]",
          flowId: "reorder-verify",
          routeId: id,
        });
        return NextResponse.json(
          { error: "Failed to verify stop ownership", code: "VERIFY_FAILED" },
          { status: 500 }
        );
      }

      if (!routeStops || routeStops.length !== submittedIds.length) {
        return NextResponse.json(
          {
            error: "Some stop IDs do not belong to this route",
            code: "STOP_ROUTE_MISMATCH",
            detail: `Expected ${submittedIds.length} stops, found ${routeStops?.length ?? 0} in route`,
          },
          { status: 400 }
        );
      }

      // Atomic batch update via RPC
      const { error: batchError } = await supabase.rpc("batch_update_stop_indices", {
        p_stop_ids: stopOrder.map((s) => s.stopId),
        p_indices: stopOrder.map((s) => s.stopIndex),
      });

      if (batchError) {
        logger.exception(batchError, {
          api: "admin/routes/[id]",
          flowId: "reorder-stops",
          routeId: id,
          stopCount: stopOrder.length,
        });
        return NextResponse.json(
          {
            error: "Failed to reorder stops",
            code: "BATCH_UPDATE_FAILED",
            detail: batchError.message,
          },
          { status: 500 }
        );
      }

      // Clear stale polyline after manual reorder
      await supabase.from("routes").update({ optimized_polyline: null }).eq("id", id);

      return NextResponse.json({
        id,
        message: "Stops reordered successfully",
      });
    }

    // Otherwise, validate as regular update
    const updateResult = updateRouteSchema.safeParse(body);

    if (!updateResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: updateResult.error.flatten() },
        { status: 400 }
      );
    }

    const { driverId, status } = updateResult.data;
    const routeUpdate: Record<string, unknown> = {};
    let statusChangeInfo: { fromStatus: string; toStatus: string } | null = null;

    if (driverId !== undefined) {
      routeUpdate.driver_id = driverId;
      if (driverId !== null) {
        routeUpdate.status = "assigned";
        routeUpdate.accepted_at = null; // Clear if reassigning
      } else {
        // Unassigning driver -- revert to planned
        routeUpdate.status = "planned";
      }
    }

    if (status !== undefined) {
      // Fetch current route status BEFORE applying update
      const { data: currentRoute, error: fetchError } = await supabase
        .from("routes")
        .select("status")
        .eq("id", id)
        .single();

      if (fetchError || !currentRoute) {
        return NextResponse.json({ error: "Route not found" }, { status: 404 });
      }

      const currentStatus = currentRoute.status as RouteStatus;

      // Guard: validate lifecycle transition
      if (!isValidRouteTransition(currentStatus, status)) {
        return NextResponse.json(
          {
            error: `Cannot transition route from "${currentStatus}" to "${status}"`,
            validTransitions: getValidRouteTransitions(currentStatus),
          },
          { status: 400 }
        );
      }

      routeUpdate.status = status as RouteStatus;

      // Timestamp management based on target status
      if (status === "assigned") {
        routeUpdate.accepted_at = null; // Clear stale acceptance timestamp
      }
      if (status === "in_progress") {
        routeUpdate.started_at = new Date().toISOString();
      } else if (status === "completed") {
        // Validate all stops are in terminal state before completing
        const { data: nonTerminalStops } = await supabase
          .from("route_stops")
          .select("id, status")
          .eq("route_id", id)
          .not("status", "in", '("delivered","skipped")')
          .limit(1);

        if (nonTerminalStops && nonTerminalStops.length > 0) {
          return NextResponse.json(
            {
              error: "Cannot complete route: some stops are not delivered or skipped",
            },
            { status: 400 }
          );
        }

        routeUpdate.completed_at = new Date().toISOString();
      }

      // Store status change info for Sentry audit (logged AFTER successful update)
      statusChangeInfo = { fromStatus: currentStatus, toStatus: status };
    }

    if (Object.keys(routeUpdate).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const { data: updatedRoute, error: updateError } = await supabase
      .from("routes")
      .update(routeUpdate)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      logger.exception(updateError, { api: "admin/routes/[id]", flowId: "update", routeId: id });
      return NextResponse.json({ error: "Failed to update route" }, { status: 500 });
    }

    // Sentry audit logging — only after successful DB update to prevent phantom events
    if (statusChangeInfo) {
      Sentry.captureMessage("Admin route status override", {
        level: "info",
        tags: { action: "route_status_override" },
        extra: {
          routeId: id,
          adminUserId: userId,
          fromStatus: statusChangeInfo.fromStatus,
          toStatus: statusChangeInfo.toStatus,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      id: updatedRoute.id,
      status: updatedRoute.status,
      driverId: updatedRoute.driver_id,
      message: "Route updated successfully",
    });
  } catch (error) {
    logger.exception(error, { api: "admin/routes/[id]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/routes/[id]
 * Delete route (only if planned)
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, userId } = auth;

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: userId,
      role: "admin",
      route: "admin/routes/:id",
    });
    if (rl.limited) return rl.response;

    // Check route status
    const { data: route } = await supabase.from("routes").select("status").eq("id", id).single();

    if (!route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    if (route.status !== "planned" && route.status !== "assigned") {
      return NextResponse.json(
        { error: "Can only delete planned or assigned routes" },
        { status: 400 }
      );
    }

    // Delete route (stops will cascade)
    const { error: deleteError } = await supabase.from("routes").delete().eq("id", id);

    if (deleteError) {
      logger.exception(deleteError, { api: "admin/routes/[id]", flowId: "delete", routeId: id });
      return NextResponse.json({ error: "Failed to delete route" }, { status: 500 });
    }

    return NextResponse.json({
      id,
      message: "Route deleted successfully",
    });
  } catch (error) {
    logger.exception(error, { api: "admin/routes/[id]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
