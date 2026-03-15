import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireDriver } from "@/lib/auth";
import { checkRateLimit, driverActionLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/utils/logger";

interface RouteParams {
  params: Promise<{ routeId: string; stopId: string }>;
}

const deliveryNotesSchema = z.object({
  deliveryNotes: z.string().max(500),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { routeId, stopId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const parseResult = deliveryNotesSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const { deliveryNotes } = parseResult.data;

    const auth = await requireDriver();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, driverId } = auth;

    const rl = await checkRateLimit({
      limiter: driverActionLimiter,
      identifier: driverId,
      role: "driver",
      route: "driver/routes/[routeId]/stops/[stopId]/notes",
    });
    if (rl.limited) return rl.response;

    // Verify driver owns the route and route is in progress
    const { data: route, error: routeError } = await supabase
      .from("routes")
      .select("id, status, driver_id")
      .eq("id", routeId)
      .single();

    if (routeError || !route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    if (route.driver_id !== driverId) {
      return NextResponse.json({ error: "Not authorized to update this stop" }, { status: 403 });
    }

    if (route.status !== "in_progress") {
      return NextResponse.json(
        { error: "Route must be in progress to update notes" },
        { status: 400 }
      );
    }

    // Update delivery notes — chain .select("id") to verify write succeeded
    const { data: updated, error: updateError } = await supabase
      .from("route_stops")
      .update({ delivery_notes: deliveryNotes })
      .eq("id", stopId)
      .eq("route_id", routeId)
      .select("id");

    if (updateError) {
      logger.exception(updateError, {
        api: "driver/routes/[routeId]/stops/[stopId]/notes",
        routeId,
        stopId,
        driverId,
      });
      return NextResponse.json({ error: "Failed to update delivery notes" }, { status: 500 });
    }

    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: "Stop not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.exception(error, {
      api: "driver/routes/[routeId]/stops/[stopId]/notes",
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
