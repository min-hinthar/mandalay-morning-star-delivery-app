import { NextRequest, NextResponse } from "next/server";
import { requireDriver } from "@/lib/auth";
import { apiError } from "@/lib/utils/api-error";
import { logger } from "@/lib/utils/logger";
import { locationUpdateSchema } from "@/lib/validations/driver-api";
import { checkRateLimit, driverLocationLimiter } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body first (before auth to fail fast on bad input)
    const body = await request.json();
    const parseResult = locationUpdateSchema.safeParse(body);

    if (!parseResult.success) {
      return apiError("VALIDATION_ERROR", parseResult.error.issues[0].message, 400);
    }

    const { latitude, longitude, accuracy, heading, speed, routeId } = parseResult.data;

    const auth = await requireDriver();
    if (!auth.success) {
      return apiError(auth.status === 403 ? "FORBIDDEN" : "UNAUTHORIZED", auth.error, auth.status);
    }
    const { supabase, driverId } = auth;

    // Rate limit via Upstash (replaces DB-query-based rate check)
    const rl = await checkRateLimit({
      limiter: driverLocationLimiter,
      identifier: driverId,
      role: "driver",
      route: "driver/location",
    });
    if (rl.limited) return rl.response;

    // Verify route belongs to driver if routeId provided
    if (routeId) {
      const { data: route } = await supabase
        .from("routes")
        .select("driver_id")
        .eq("id", routeId)
        .single();

      if (route && route.driver_id !== driverId) {
        return apiError("FORBIDDEN", "Route does not belong to driver", 403);
      }
    }

    // Insert location update
    const recordedAt = new Date().toISOString();
    const { error: insertError } = await supabase.from("location_updates").insert({
      driver_id: driverId,
      route_id: routeId || null,
      latitude,
      longitude,
      accuracy,
      heading: heading || null,
      speed: speed || null,
      recorded_at: recordedAt,
      source: "mobile",
    });

    if (insertError) {
      logger.exception(insertError, { api: "driver/location", flowId: "insert-location" });
      return apiError("INTERNAL_ERROR", "Failed to save location", 500);
    }

    return NextResponse.json({
      success: true,
      recordedAt,
    });
  } catch (error) {
    logger.exception(error, { api: "driver/location" });
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}
