import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { requireDriver } from "@/lib/auth";
import { sendEmail, buildEmailElement } from "@/lib/email";
import { getAdminEmails } from "@/lib/email/admin-recipients";
import { checkRateLimit, driverActionLimiter } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { reportExceptionSchema } from "@/lib/validations/driver-api";
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
  order_id: string;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { routeId, stopId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const parseResult = reportExceptionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const { type, description } = parseResult.data;

    const auth = await requireDriver();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, driverId } = auth;

    const rl = await checkRateLimit({
      limiter: driverActionLimiter,
      identifier: driverId,
      role: "driver",
      route: "driver/routes/[routeId]/stops/[stopId]/exception",
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
        { error: "Not authorized to report exception for this stop" },
        { status: 403 }
      );
    }

    // Verify route is in progress
    if (route.status !== "in_progress") {
      return NextResponse.json(
        { error: "Route must be in progress to report exceptions" },
        { status: 400 }
      );
    }

    // Get stop
    const { data: stop, error: stopError } = await supabase
      .from("route_stops")
      .select("id, status, route_id, order_id")
      .eq("id", stopId)
      .eq("route_id", routeId)
      .returns<StopQueryResult[]>()
      .single();

    if (stopError || !stop) {
      return NextResponse.json({ error: "Stop not found" }, { status: 404 });
    }

    // Idempotency: status check prevents duplicate exception reports for completed stops.
    // Once a stop is delivered or skipped, this returns 400 (permanent failure for the client queue).
    if (stop.status === "delivered" || stop.status === "skipped") {
      return NextResponse.json(
        { error: `Cannot report exception for stop with status: ${stop.status}` },
        { status: 400 }
      );
    }

    // Idempotency: check for existing exception on this stop to prevent rapid double-tap duplicates.
    // If an exception already exists, return it as an idempotent success response.
    interface ExceptionQueryResult {
      id: string;
    }

    const { data: existingException } = await supabase
      .from("delivery_exceptions")
      .select("id")
      .eq("route_stop_id", stopId)
      .limit(1)
      .returns<ExceptionQueryResult[]>()
      .single();

    if (existingException) {
      return NextResponse.json({
        success: true,
        exceptionId: existingException.id,
        stopStatus: "skipped" as RouteStopStatus,
      });
    }

    // Create the exception
    interface ExceptionInsertResult {
      id: string;
    }

    const { data: exception, error: insertError } = await supabase
      .from("delivery_exceptions")
      .insert({
        route_stop_id: stopId,
        exception_type: type,
        description: description || null,
      })
      .select("id")
      .returns<ExceptionInsertResult[]>()
      .single();

    if (insertError || !exception) {
      logger.exception(insertError, { api: "driver/routes/[routeId]/stops/[stopId]/exception" });
      return NextResponse.json({ error: "Failed to create exception" }, { status: 500 });
    }

    // Mark the stop as skipped
    await supabase.from("route_stops").update({ status: "skipped" }).eq("id", stopId);

    // Set needs_contact on the order
    if (stop.order_id) {
      const { error: orderUpdateError } = await supabase
        .from("orders")
        .update({ needs_contact: true })
        .eq("id", stop.order_id)
        .select("id");

      if (orderUpdateError) {
        logger.warn("Failed to set needs_contact on order", {
          api: "driver/routes/[routeId]/stops/[stopId]/exception",
          orderId: stop.order_id,
          error: orderUpdateError.message,
        });
      }
    }

    // Audit log
    await supabase
      .from("order_audit_log")
      .insert({
        order_id: stop.order_id,
        action: "delivery_exception",
        actor_id: driverId,
        actor_role: "driver",
        old_value: null,
        new_value: {
          exception_type: type,
          description: description || null,
        } as import("@/types/database").Json,
        reason: description || `Exception: ${type}`,
      })
      .then(({ error }) => {
        if (error) {
          logger.warn("Failed to create audit log for exception", {
            api: "driver/routes/[routeId]/stops/[stopId]/exception",
            error: error.message,
          });
        }
      });

    // Update route stats
    await updateRouteStats(supabase, routeId);

    // Send admin notification via after()
    after(async () => {
      try {
        const admins = await getAdminEmails();
        for (const admin of admins) {
          await sendEmail({
            to: admin.email,
            subject: `Delivery Exception: ${type}`,
            react: buildEmailElement("admin_new_order", {
              customerName: admin.full_name || "Admin",
              orderId: stop.order_id,
              items: [],
              subtotalCents: 0,
              deliveryFeeCents: 0,
              taxCents: 0,
              tipCents: 0,
              totalCents: 0,
              deliveryWindowStart: null,
              deliveryWindowEnd: null,
              address: null,
              specialInstructions: `DELIVERY EXCEPTION: ${type}${description ? ` - ${description}` : ""}`,
            }),
            type: "admin_new_order",
            orderId: stop.order_id,
            userId: admin.id,
            idempotencyKey: `exception-${exception.id}-${admin.id}`,
          });
        }
      } catch (emailError) {
        logger.warn("Failed to send admin exception notification", {
          api: "driver/routes/[routeId]/stops/[stopId]/exception",
          error: emailError instanceof Error ? emailError.message : String(emailError),
        });
      }
    });

    // Set next pending stop to enroute
    interface NextStopResult {
      id: string;
    }

    const { data: nextStop } = await supabase
      .from("route_stops")
      .select("id")
      .eq("route_id", routeId)
      .eq("status", "pending")
      .order("stop_index", { ascending: true })
      .limit(1)
      .returns<NextStopResult[]>()
      .single();

    if (nextStop) {
      await supabase.from("route_stops").update({ status: "enroute" }).eq("id", nextStop.id);
    }

    return NextResponse.json({
      success: true,
      exceptionId: exception.id,
      stopStatus: "skipped" as RouteStopStatus,
    });
  } catch (error) {
    logger.exception(error, { api: "driver/routes/[routeId]/stops/[stopId]/exception" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function updateRouteStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  routeId: string
) {
  const { data: stops } = await supabase
    .from("route_stops")
    .select("status")
    .eq("route_id", routeId);

  if (!stops) return;

  const stats = {
    total_stops: stops.length,
    pending_stops: stops.filter((s) => s.status === "pending" || s.status === "enroute").length,
    delivered_stops: stops.filter((s) => s.status === "delivered").length,
    skipped_stops: stops.filter((s) => s.status === "skipped").length,
    completion_rate: 0,
  };

  stats.completion_rate =
    stats.total_stops > 0
      ? Math.round(((stats.delivered_stops + stats.skipped_stops) / stats.total_stops) * 100)
      : 0;

  await supabase
    .from("routes")
    .update({ stats_json: stats as unknown as import("@/types/database").Json })
    .eq("id", routeId);
}
