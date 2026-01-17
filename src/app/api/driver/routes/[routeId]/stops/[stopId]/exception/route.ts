import { NextRequest, NextResponse } from "next/server";
import { requireDriver } from "@/lib/auth";
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
}

interface ReportExceptionResponse {
  success: boolean;
  exceptionId: string;
  stopStatus: RouteStopStatus;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ReportExceptionResponse | { error: string }>> {
  try {
    const { routeId, stopId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const parseResult = reportExceptionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { type, description } = parseResult.data;

    const auth = await requireDriver();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, driverId } = auth;

    // Get route
    const { data: route, error: routeError } = await supabase
      .from("routes")
      .select("id, status, driver_id")
      .eq("id", routeId)
      .returns<RouteQueryResult[]>()
      .single();

    if (routeError || !route) {
      return NextResponse.json(
        { error: "Route not found" },
        { status: 404 }
      );
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
      .select("id, status, route_id")
      .eq("id", stopId)
      .eq("route_id", routeId)
      .returns<StopQueryResult[]>()
      .single();

    if (stopError || !stop) {
      return NextResponse.json(
        { error: "Stop not found" },
        { status: 404 }
      );
    }

    // Check stop isn't already delivered/skipped
    if (stop.status === "delivered" || stop.status === "skipped") {
      return NextResponse.json(
        { error: `Cannot report exception for stop with status: ${stop.status}` },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Failed to create exception" },
        { status: 500 }
      );
    }

    // Mark the stop as skipped
    await supabase
      .from("route_stops")
      .update({ status: "skipped" })
      .eq("id", stopId);

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
      await supabase
        .from("route_stops")
        .update({ status: "enroute" })
        .eq("id", nextStop.id);
    }

    return NextResponse.json({
      success: true,
      exceptionId: exception.id,
      stopStatus: "skipped" as RouteStopStatus,
    });
  } catch (error) {
    logger.exception(error, { api: "driver/routes/[routeId]/stops/[stopId]/exception" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
