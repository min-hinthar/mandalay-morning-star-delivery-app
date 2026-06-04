import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";
import { getZonedDateString, getZonedDayRangeUtc } from "@/lib/utils/delivery-dates";

// ============================================
// TYPES
// ============================================

export interface DriverLocation {
  driverId: string;
  driverName: string | null;
  routeId: string | null;
  lat: number;
  lng: number;
  heading: number | null;
  recordedAt: string;
  /** True when the latest fix is older than the freshness threshold. */
  isStale: boolean;
}

interface RouteDriverRow {
  driver_id: string | null;
  routes_driver_id_fkey: { profiles: { full_name: string | null } | null } | null;
}

interface LocationRow {
  driver_id: string;
  route_id: string | null;
  latitude: number;
  longitude: number;
  heading: number | null;
  recorded_at: string;
}

// Locations older than this are flagged stale (driver app reports ~every 30s).
const STALE_THRESHOLD_MS = 5 * 60 * 1000;

// ============================================
// GET /api/admin/ops/driver-locations?date=YYYY-MM-DD
// Latest known location for each driver assigned to a route on the given date.
// ============================================

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: auth.userId,
      role: "admin",
      route: "admin/ops/driver-locations",
    });
    if (rl.limited) return rl.response;

    const { supabase } = auth;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || getZonedDateString();
    const { startUtc, endUtc } = getZonedDayRangeUtc(date);

    // Drivers assigned to a route on this date (with name). The qualified FK hint
    // `routes_driver_id_fkey` is required — routes has a 2nd FK to drivers
    // (declined_by), so an unqualified `drivers (` join would PGRST201.
    const { data: routeRows, error: routesError } = await supabase
      .from("routes")
      .select(
        `
        driver_id,
        routes_driver_id_fkey:drivers!routes_driver_id_fkey ( profiles ( full_name ) )
      `
      )
      .eq("delivery_date", date)
      .not("driver_id", "is", null)
      .returns<RouteDriverRow[]>();

    if (routesError) {
      logger.exception(routesError, {
        api: "admin/ops/driver-locations",
        flowId: "fetch-routes",
        userId: auth.userId,
      });
      return NextResponse.json({ error: "Failed to fetch routes" }, { status: 500 });
    }

    // Unique driver IDs → name map.
    const nameByDriver = new Map<string, string | null>();
    for (const row of routeRows ?? []) {
      if (row.driver_id && !nameByDriver.has(row.driver_id)) {
        nameByDriver.set(row.driver_id, row.routes_driver_id_fkey?.profiles?.full_name ?? null);
      }
    }
    const driverIds = [...nameByDriver.keys()];

    if (driverIds.length === 0) {
      return NextResponse.json([]);
    }

    // Latest fix per driver, bounded to the selected delivery day so a future
    // date shows nothing (no pings yet) and a past date shows that day's last
    // positions — not each driver's last-ever ping. The (driver_id,
    // recorded_at DESC) index makes each single-row lookup cheap; driver count
    // per day is small, so parallel per-driver queries avoid a DISTINCT ON / RPC.
    const now = Date.now();
    const results = await Promise.all(
      driverIds.map(async (driverId) => {
        const { data, error } = await supabase
          .from("location_updates")
          .select("driver_id, route_id, latitude, longitude, heading, recorded_at")
          .eq("driver_id", driverId)
          .gte("recorded_at", startUtc)
          .lt("recorded_at", endUtc)
          .order("recorded_at", { ascending: false })
          .limit(1)
          .returns<LocationRow[]>()
          .maybeSingle();

        if (error || !data) return null;

        const recordedMs = new Date(data.recorded_at).getTime();
        const location: DriverLocation = {
          driverId: data.driver_id,
          driverName: nameByDriver.get(data.driver_id) ?? null,
          routeId: data.route_id,
          lat: data.latitude,
          lng: data.longitude,
          heading: data.heading,
          recordedAt: data.recorded_at,
          isStale: now - recordedMs > STALE_THRESHOLD_MS,
        };
        return location;
      })
    );

    return NextResponse.json(results.filter((r): r is DriverLocation => r !== null));
  } catch (error) {
    logger.exception(error, { api: "admin/ops/driver-locations", flowId: "fetch" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
