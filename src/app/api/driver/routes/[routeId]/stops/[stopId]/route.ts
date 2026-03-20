import { NextRequest, NextResponse } from "next/server";
import { requireDriver } from "@/lib/auth";
import { checkRateLimit, driverActionLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/utils/logger";
import { updateStopStatusSchema, isValidStatusTransition } from "@/lib/validations/driver-api";
import type { RouteStopStatus } from "@/types/driver";

interface RouteParams {
  params: Promise<{ routeId: string; stopId: string }>;
}

interface RouteQueryResult {
  id: string;
  status: string;
  driver_id: string;
}

interface StopQueryResult {
  id: string;
  status: string;
  route_id: string;
  stop_index: number;
  order_id: string;
}

interface PromotionResult {
  promoted_stop_id: string | null;
  stop_index: number | null;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { routeId, stopId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const parseResult = updateStopStatusSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const { status: newStatus, deliveryNotes } = parseResult.data;

    const auth = await requireDriver();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, driverId } = auth;

    const rl = await checkRateLimit({
      limiter: driverActionLimiter,
      identifier: driverId,
      role: "driver",
      route: "driver/routes/[routeId]/stops/[stopId]",
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
      return NextResponse.json({ error: "Not authorized to update this stop" }, { status: 403 });
    }

    // Verify route is in progress
    if (route.status !== "in_progress") {
      return NextResponse.json(
        { error: "Route must be in progress to update stops" },
        { status: 400 }
      );
    }

    // Get current stop
    const { data: stop, error: stopError } = await supabase
      .from("route_stops")
      .select("id, status, route_id, stop_index, order_id")
      .eq("id", stopId)
      .eq("route_id", routeId)
      .returns<StopQueryResult[]>()
      .single();

    if (stopError || !stop) {
      return NextResponse.json({ error: "Stop not found" }, { status: 404 });
    }

    // Idempotency: status transition validation prevents duplicate updates.
    // A duplicate "mark as arrived" when already arrived returns 400, which
    // the client treats as a permanent failure and removes from the queue.
    if (!isValidStatusTransition(stop.status, newStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from ${stop.status} to ${newStatus}` },
        { status: 400 }
      );
    }

    // Prepare update data
    const now = new Date().toISOString();
    const updateData: Record<string, string | null> = {
      status: newStatus,
    };

    if (newStatus === "arrived") {
      updateData.arrived_at = now;
    } else if (newStatus === "delivered") {
      updateData.delivered_at = now;
    }

    if (deliveryNotes) {
      updateData.delivery_notes = deliveryNotes;
    }

    // Update the stop
    const { error: updateError } = await supabase
      .from("route_stops")
      .update(updateData)
      .eq("id", stopId);

    if (updateError) {
      logger.exception(updateError, {
        api: "driver/routes/[routeId]/stops/[stopId]",
        routeId,
        stopId,
        driverId,
      });
      return NextResponse.json({ error: "Failed to update stop" }, { status: 500 });
    }

    // If delivered, update the order status with optimistic lock
    let orderUpdated = false;
    if (newStatus === "delivered") {
      const { data: updatedOrder, error: orderError } = await supabase
        .from("orders")
        .update({ status: "delivered", delivered_at: now })
        .eq("id", stop.order_id)
        .eq("status", "out_for_delivery")
        .select("id");

      if (orderError) {
        logger.warn("Failed to update order status to delivered", {
          api: "driver/routes/[routeId]/stops/[stopId]",
          orderId: stop.order_id,
          error: orderError.message,
        });
      } else {
        orderUpdated = (updatedOrder?.length ?? 0) > 0;
        if (!orderUpdated) {
          logger.warn("Order status update was a no-op (possible race condition)", {
            api: "driver/routes/[routeId]/stops/[stopId]",
            orderId: stop.order_id,
          });
        }
      }
    }

    // Promote next stop atomically via RPC (prevents race condition on concurrent completions)
    let nextStop: { id: string; stopIndex: number } | null = null;
    if (newStatus === "delivered" || newStatus === "skipped") {
      const { data: rpcData, error: promotionError } = await supabase.rpc("promote_next_stop", {
        p_route_id: routeId,
        p_completed_stop_id: stopId,
      });
      const promotionResult = rpcData as unknown as PromotionResult | null;

      if (promotionError) {
        logger.warn("Stop promotion failed", {
          api: "driver/routes/[routeId]/stops/[stopId]",
          routeId,
          stopId,
          error: promotionError.message,
        });
      } else if (promotionResult?.promoted_stop_id) {
        nextStop = {
          id: promotionResult.promoted_stop_id,
          stopIndex: promotionResult.stop_index as number,
        };
        logger.info("Stop promoted to enroute", {
          api: "driver/routes/[routeId]/stops/[stopId]",
          routeId,
          stopId,
          promotedStopId: promotionResult.promoted_stop_id,
          stopIndex: promotionResult.stop_index,
        });
      } else {
        logger.info("No pending stops remaining", {
          api: "driver/routes/[routeId]/stops/[stopId]",
          routeId,
        });
      }
    }

    return NextResponse.json({
      success: true,
      stop: {
        id: stopId,
        status: newStatus as RouteStopStatus,
        arrivedAt: newStatus === "arrived" ? now : null,
        deliveredAt: newStatus === "delivered" ? now : null,
      },
      ...(newStatus === "delivered" ? { orderUpdated } : {}),
      nextStop,
    });
  } catch (error) {
    logger.exception(error, { api: "driver/routes/[routeId]/stops/[stopId]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
