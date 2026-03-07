import { NextRequest, NextResponse } from "next/server";
import { requireDriver } from "@/lib/auth";
import { checkRateLimit, driverActionLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/utils/logger";
import { DAYS_OF_WEEK } from "@/lib/availability";
import type { DayOfWeek, DriverAvailability } from "@/types/driver";

const DEFAULT_AVAILABILITY: DriverAvailability = {
  available_days: [],
  blocked_dates: [],
};

/** Validate a YYYY-MM-DD date string */
function isValidDateString(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s + "T12:00:00Z").getTime());
}

/** Validate DriverAvailability shape */
function validateAvailability(
  body: unknown
): { valid: true; data: DriverAvailability } | { valid: false; error: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be an object" };
  }

  const obj = body as Record<string, unknown>;

  if (!Array.isArray(obj.available_days)) {
    return { valid: false, error: "available_days must be an array" };
  }

  if (!Array.isArray(obj.blocked_dates)) {
    return { valid: false, error: "blocked_dates must be an array" };
  }

  const validDays = DAYS_OF_WEEK as readonly string[];
  for (const day of obj.available_days) {
    if (typeof day !== "string" || !validDays.includes(day)) {
      return { valid: false, error: `Invalid day: ${String(day)}` };
    }
  }

  for (const date of obj.blocked_dates) {
    if (typeof date !== "string" || !isValidDateString(date)) {
      return { valid: false, error: `Invalid date: ${String(date)}` };
    }
  }

  return {
    valid: true,
    data: {
      available_days: obj.available_days as DayOfWeek[],
      blocked_dates: obj.blocked_dates as string[],
    },
  };
}

export async function GET() {
  try {
    const auth = await requireDriver();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, driverId } = auth;

    const rl = await checkRateLimit({
      limiter: driverActionLimiter,
      identifier: driverId,
      role: "driver",
      route: "driver/availability",
    });
    if (rl.limited) return rl.response;

    interface AvailabilityResult {
      availability_json: DriverAvailability | null;
    }

    const { data: driver, error } = await supabase
      .from("drivers")
      .select("availability_json")
      .eq("id", driverId)
      .returns<AvailabilityResult[]>()
      .single();

    if (error) {
      logger.exception(error, { api: "driver/availability" });
      return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
    }

    return NextResponse.json({
      availability: driver?.availability_json ?? DEFAULT_AVAILABILITY,
    });
  } catch (error) {
    logger.exception(error, { api: "driver/availability" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireDriver();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase, driverId } = auth;

    const rl = await checkRateLimit({
      limiter: driverActionLimiter,
      identifier: driverId,
      role: "driver",
      route: "driver/availability",
    });
    if (rl.limited) return rl.response;

    const body = await request.json();
    const validation = validateAvailability(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { error } = await supabase
      .from("drivers")
      .update({ availability_json: validation.data as unknown as import("@/types/database").Json })
      .eq("id", driverId);

    if (error) {
      logger.exception(error, { api: "driver/availability" });
      return NextResponse.json({ error: "Failed to update availability" }, { status: 500 });
    }

    return NextResponse.json({ availability: validation.data });
  } catch (error) {
    logger.exception(error, { api: "driver/availability" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
