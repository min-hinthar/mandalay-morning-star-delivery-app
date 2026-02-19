import { NextRequest, NextResponse } from "next/server";
import { requireDriver } from "@/lib/auth";
import { checkRateLimit, driverActionLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/utils/logger";
import { computeRouteEarnings, aggregateByPeriod } from "@/lib/earnings";
import type { EarningsPeriod } from "@/lib/earnings";

const TIMEZONE = "America/Los_Angeles";

const VALID_PERIODS: EarningsPeriod[] = ["daily", "weekly", "monthly"];
const DEFAULT_PAY_RATE_CENTS = 500;

/** Compute start date based on period */
function getStartDate(period: EarningsPeriod): string {
  const now = new Date();
  // Use LA timezone for date calculation
  const laDate = new Date(now.toLocaleString("en-US", { timeZone: TIMEZONE }));

  switch (period) {
    case "daily":
      laDate.setDate(laDate.getDate() - 14);
      break;
    case "weekly":
      laDate.setDate(laDate.getDate() - 12 * 7);
      break;
    case "monthly":
      laDate.setMonth(laDate.getMonth() - 12);
      break;
  }

  // Format as YYYY-MM-DD
  const year = laDate.getFullYear();
  const month = String(laDate.getMonth() + 1).padStart(2, "0");
  const day = String(laDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface RouteStopQueryResult {
  status: string;
}

interface RouteQueryResult {
  id: string;
  delivery_date: string;
  route_stops: RouteStopQueryResult[];
}

interface AppSettingResult {
  value: number;
}

export async function GET(request: NextRequest) {
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
      route: "driver/earnings",
    });
    if (rl.limited) return rl.response;

    // Parse and validate period query param
    const url = new URL(request.url);
    const periodParam = url.searchParams.get("period") ?? "weekly";
    const period: EarningsPeriod = VALID_PERIODS.includes(periodParam as EarningsPeriod)
      ? (periodParam as EarningsPeriod)
      : "weekly";

    const startDate = getStartDate(period);

    // Parallel: pay rate + routes with stops
    const [settingResult, routesResult] = await Promise.all([
      supabase
        .from("app_settings")
        .select("value")
        .eq("key", "driver_pay_per_stop_cents")
        .returns<AppSettingResult[]>()
        .single(),
      supabase
        .from("routes")
        .select("id, delivery_date, route_stops(status)")
        .eq("driver_id", driverId)
        .eq("status", "completed")
        .gte("delivery_date", startDate)
        .order("delivery_date", { ascending: true })
        .returns<RouteQueryResult[]>(),
    ]);

    const rateCents =
      typeof settingResult.data?.value === "number"
        ? settingResult.data.value
        : DEFAULT_PAY_RATE_CENTS;

    if (routesResult.error) {
      logger.exception(routesResult.error, { api: "driver/earnings" });
      return NextResponse.json({ error: "Failed to fetch routes" }, { status: 500 });
    }

    const routes = routesResult.data ?? [];

    // Compute earnings
    const routeEarnings = computeRouteEarnings(routes, rateCents);
    const chartData = aggregateByPeriod(routeEarnings, period);
    const totalCents = routeEarnings.reduce((sum, re) => sum + re.earningsCents, 0);

    return NextResponse.json({
      routeEarnings,
      chartData,
      rateCents,
      period,
      totalCents,
    });
  } catch (error) {
    logger.exception(error, { api: "driver/earnings" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
