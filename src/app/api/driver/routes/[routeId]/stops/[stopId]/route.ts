import { after, NextRequest, NextResponse } from "next/server";
import { requireDriver } from "@/lib/auth";
import { checkRateLimit, driverActionLimiter } from "@/lib/rate-limit";
import { sendOrderStatusEmail } from "@/lib/email";
import { sendOrderStatusPush } from "@/lib/push/order-status-push";
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
  arrived_at: string | null;
  delivered_at: string | null;
}

interface PromotionResult {
  promoted_stop_id: string | null;
  stop_index: number | null;
}

type NextStop = { id: string; stopIndex: number };

type DriverAuthSuccess = Extract<Awaited<ReturnType<typeof requireDriver>>, { success: true }>;
type SupabaseClient = DriverAuthSuccess["supabase"];

/**
 * Recover route progress when the atomic `promote_next_stop` RPC errors.
 * Best-effort: returns the next active stop, or `null` when none could be
 * promoted (route complete, or a rare double-failure that is logged for
 * follow-up). Never throws and never fails the request — the stop status was
 * already committed by the caller, so a promotion hiccup must not report the
 * delivery as failed; the client refetches the route to find the next stop.
 */
async function fallbackPromoteNextStop(
  supabase: SupabaseClient,
  routeId: string
): Promise<NextStop | null> {
  // A stop may already be enroute (partial RPC apply or concurrent advance).
  const { data: enroute } = await supabase
    .from("route_stops")
    .select("id, stop_index")
    .eq("route_id", routeId)
    .eq("status", "enroute")
    .order("stop_index", { ascending: true })
    .limit(1)
    .returns<{ id: string; stop_index: number }[]>();

  if (enroute && enroute.length > 0) {
    return { id: enroute[0].id, stopIndex: enroute[0].stop_index };
  }

  // Promote the lowest-index pending stop directly, guarded against races.
  const { data: pending } = await supabase
    .from("route_stops")
    .select("id, stop_index")
    .eq("route_id", routeId)
    .eq("status", "pending")
    .order("stop_index", { ascending: true })
    .limit(1)
    .returns<{ id: string; stop_index: number }[]>();

  if (!pending || pending.length === 0) {
    return null; // No pending stops remain — route is effectively complete.
  }

  const { data: promoted, error: promoteError } = await supabase
    .from("route_stops")
    .update({ status: "enroute" })
    .eq("id", pending[0].id)
    .eq("status", "pending")
    .select("id");

  if (promoteError) {
    logger.exception(promoteError, {
      api: "driver/routes/[routeId]/stops/[stopId]",
      flowId: "fallback-promotion",
      routeId,
    });
    return null;
  }

  // No-op means another request advanced the stop first — re-read the enroute stop.
  if ((promoted?.length ?? 0) === 0) {
    const { data: enrouteRetry } = await supabase
      .from("route_stops")
      .select("id, stop_index")
      .eq("route_id", routeId)
      .eq("status", "enroute")
      .order("stop_index", { ascending: true })
      .limit(1)
      .returns<{ id: string; stop_index: number }[]>();

    if (enrouteRetry && enrouteRetry.length > 0) {
      return { id: enrouteRetry[0].id, stopIndex: enrouteRetry[0].stop_index };
    }
    logger.warn("Fallback promotion could not advance the route", {
      api: "driver/routes/[routeId]/stops/[stopId]",
      flowId: "fallback-promotion",
      routeId,
    });
    return null;
  }

  return { id: pending[0].id, stopIndex: pending[0].stop_index };
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
      .select("id, status, route_id, stop_index, order_id, arrived_at, delivered_at")
      .eq("id", stopId)
      .eq("route_id", routeId)
      .returns<StopQueryResult[]>()
      .single();

    if (stopError || !stop) {
      return NextResponse.json({ error: "Stop not found" }, { status: 404 });
    }

    // Idempotent re-submission. An at-least-once offline queue may retry a
    // status update whose original response was lost (network blip, or a 500
    // raised after the write already committed). If the stop is already in the
    // requested status, return success instead of a 400 the queue would surface
    // as a permanent failure for a delivery that actually happened.
    if (stop.status === newStatus) {
      return NextResponse.json({
        success: true,
        idempotent: true,
        stop: {
          id: stopId,
          status: newStatus as RouteStopStatus,
          arrivedAt: stop.arrived_at,
          deliveredAt: stop.delivered_at,
        },
        ...(newStatus === "delivered" ? { orderUpdated: true } : {}),
        nextStop: null,
      });
    }

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

      // Notify the customer their order arrived — only when THIS request made the
      // transition (orderUpdated), so a race/no-op doesn't email. The shared
      // sender's stable key (delivered-<id>) dedupes any overlap with the admin
      // route UI marking the same stop delivered. Fire-and-forget via after().
      if (orderUpdated) {
        const deliveredOrderId = stop.order_id;
        after(async () => {
          try {
            await sendOrderStatusEmail(deliveredOrderId, "delivered", { deliveredAt: now });
          } catch (emailErr) {
            logger.exception(emailErr, {
              api: "driver/routes/[routeId]/stops/[stopId]",
              orderId: deliveredOrderId,
              message: "delivered email failed",
            });
          }
          try {
            await sendOrderStatusPush(deliveredOrderId, "delivered");
          } catch (pushErr) {
            logger.exception(pushErr, {
              api: "driver/routes/[routeId]/stops/[stopId]",
              orderId: deliveredOrderId,
              message: "delivered push failed",
            });
          }
        });
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
        // The atomic RPC failed (rare — DB-level error). Don't return success and
        // silently strand the route with no enroute stop: recover forward progress
        // directly. First check whether a stop is already enroute (a concurrent op
        // or a partial apply may have advanced it); otherwise promote the
        // lowest-index pending stop, guarded against races.
        logger.warn("Stop promotion RPC failed; attempting fallback promotion", {
          api: "driver/routes/[routeId]/stops/[stopId]",
          routeId,
          stopId,
          error: promotionError.message,
        });

        // Best-effort recovery: never fail the request here — the stop status is
        // already committed, so the client must not re-queue it as a failure.
        nextStop = await fallbackPromoteNextStop(supabase, routeId);
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
