import { NextRequest, NextResponse } from "next/server";
import { requireDriver } from "@/lib/auth";
import { checkRateLimit, driverActionLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/utils/logger";

interface RouteParams {
  params: Promise<{ routeId: string }>;
}

interface RouteQueryResult {
  id: string;
  status: string;
  driver_id: string;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
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
      route: "driver/routes/[routeId]/accept",
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
      return NextResponse.json({ error: "Not authorized to accept this route" }, { status: 403 });
    }

    // Status guard: only assigned routes can be accepted
    if (route.status !== "assigned") {
      return NextResponse.json(
        { error: `Cannot accept route with status: ${route.status}` },
        { status: 400 },
      );
    }

    // Accept the route
    const acceptedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("routes")
      .update({ status: "accepted", accepted_at: acceptedAt })
      .eq("id", routeId)
      .select("id");

    if (updateError) {
      logger.exception(updateError, {
        api: "driver/routes/[routeId]/accept",
        routeId,
        driverId,
      });
      return NextResponse.json({ error: "Failed to accept route" }, { status: 500 });
    }

    return NextResponse.json({ success: true, acceptedAt });
  } catch (error) {
    logger.exception(error, { api: "driver/routes/[routeId]/accept" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
