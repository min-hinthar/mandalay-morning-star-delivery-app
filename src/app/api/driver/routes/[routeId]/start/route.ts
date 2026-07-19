import { after, NextRequest, NextResponse } from "next/server";
import { requireDriver } from "@/lib/auth";
import { checkRateLimit, driverActionLimiter } from "@/lib/rate-limit";
import { sendOrderStatusEmail } from "@/lib/email";
import { sendOrderStatusPush } from "@/lib/push/order-status-push";
import { logger } from "@/lib/utils/logger";

interface RouteParams {
  params: Promise<{ routeId: string }>;
}

interface RouteQueryResult {
  id: string;
  status: string;
  driver_id: string;
  started_at: string | null;
}

interface StopQueryResult {
  id: string;
  stop_index: number;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { routeId } = await params;

    const auth = await requireDriver();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, driverId, userId } = auth;

    const rl = await checkRateLimit({
      limiter: driverActionLimiter,
      identifier: driverId,
      role: "driver",
      route: "driver/routes/[routeId]/start",
    });
    if (rl.limited) return rl.response;

    // Get route
    const { data: route, error: routeError } = await supabase
      .from("routes")
      .select("id, status, driver_id, started_at")
      .eq("id", routeId)
      .returns<RouteQueryResult[]>()
      .single();

    if (routeError || !route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    // Verify driver owns this route
    if (route.driver_id !== driverId) {
      return NextResponse.json({ error: "Not authorized to start this route" }, { status: 403 });
    }

    // Must be accepted first. Allow idempotent re-entry when already in_progress
    // so a request that failed partway (e.g. the order transition below) can be
    // safely retried without leaving orders stranded in "preparing".
    if (route.status !== "accepted" && route.status !== "in_progress") {
      return NextResponse.json(
        { error: `Cannot start route — accept route first. Current status: ${route.status}` },
        { status: 400 }
      );
    }

    const alreadyStarted = route.status === "in_progress";

    // Start the route (skip the status flip when re-entering an in_progress route).
    const startedAt = new Date().toISOString();
    if (!alreadyStarted) {
      const { error: updateError } = await supabase
        .from("routes")
        .update({
          status: "in_progress",
          started_at: startedAt,
        })
        .eq("id", routeId);

      if (updateError) {
        logger.exception(updateError, { api: "driver/routes/[routeId]/start", routeId, driverId });
        return NextResponse.json({ error: "Failed to start route" }, { status: 500 });
      }
    }

    // Set first stop to "enroute" — guarded to pending so a retry never reverts a
    // stop the driver has already progressed past.
    const { data: firstStop } = await supabase
      .from("route_stops")
      .select("id, stop_index")
      .eq("route_id", routeId)
      .order("stop_index", { ascending: true })
      .limit(1)
      .returns<StopQueryResult[]>()
      .single();

    if (firstStop) {
      await supabase
        .from("route_stops")
        .update({ status: "enroute" })
        .eq("id", firstStop.id)
        .eq("status", "pending");
    }

    // Batch-transition all route orders to out_for_delivery. A failure here is now
    // surfaced as 500 (was silently logged): otherwise the orders stay in
    // "preparing" while the route is in_progress, and the optimistic lock on
    // stop-delivery (which requires status "out_for_delivery") prevents them from
    // ever reaching "delivered". The status flip above is idempotent on retry.
    const { data: routeStops } = await supabase
      .from("route_stops")
      .select("order_id")
      .eq("route_id", routeId);

    const orderIds = routeStops?.map((s) => s.order_id) ?? [];

    if (orderIds.length > 0) {
      const { data: updatedOrders, error: orderUpdateError } = await supabase
        .from("orders")
        .update({ status: "out_for_delivery" })
        .in("id", orderIds)
        .in("status", ["confirmed", "preparing"])
        .select("id");

      if (orderUpdateError) {
        logger.exception(orderUpdateError, {
          api: "driver/routes/[routeId]/start",
          routeId,
          driverId,
        });
        return NextResponse.json(
          { error: "Route started but failed to update orders. Please retry." },
          { status: 500 }
        );
      }

      logger.info("Orders transitioned to out_for_delivery", {
        api: "driver/routes/[routeId]/start",
        routeId,
        count: updatedOrders?.length ?? 0,
      });

      // Notify each customer whose order JUST transitioned to out_for_delivery.
      // Gated on the actually-updated rows (not every route order) so re-entering
      // an already-started route doesn't re-notify; the shared sender's stable
      // idempotency key (out_for_delivery-<id>) is the belt for any overlap with
      // the admin status route. Fire-and-forget via after() so a slow/failed send
      // never blocks the driver's start response.
      const transitionedIds = (updatedOrders ?? []).map((o) => o.id);
      if (transitionedIds.length > 0) {
        // Driver display name for the email (own profile → RLS self-read ok);
        // fail-soft — a missing name just omits the "your driver" line.
        const { data: driverProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", userId)
          .single();
        const driverName = driverProfile?.full_name ?? undefined;

        after(async () => {
          await Promise.all(
            transitionedIds.map(async (id) => {
              try {
                await sendOrderStatusEmail(id, "out_for_delivery", { driverName });
              } catch (emailErr) {
                logger.exception(emailErr, {
                  api: "driver/routes/[routeId]/start",
                  orderId: id,
                  message: "out_for_delivery email failed",
                });
              }
              // Web-push companion (independent of the email — one failing must
              // not skip the other). No-op without VAPID keys.
              try {
                await sendOrderStatusPush(id, "out_for_delivery");
              } catch (pushErr) {
                logger.exception(pushErr, {
                  api: "driver/routes/[routeId]/start",
                  orderId: id,
                  message: "out_for_delivery push failed",
                });
              }
            })
          );
        });
      }
    }

    return NextResponse.json({
      success: true,
      startedAt: alreadyStarted ? route.started_at : startedAt,
      firstStopId: firstStop?.id ?? null,
      ordersTransitioned: orderIds.length,
    });
  } catch (error) {
    logger.exception(error, { api: "driver/routes/[routeId]/start" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
