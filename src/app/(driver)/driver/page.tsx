import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { DriverHomeSwitch } from "./DriverHomeSwitch";
import { Skeleton } from "@/components/ui/skeleton/base";
import type { RoutesRow, RouteStats, VehicleType, DriverBadgesRow } from "@/types/driver";
import { TIMEZONE } from "@/types/delivery";
import { logger } from "@/lib/utils/logger";

function getDateInfo(): { todayStr: string; dayOfWeek: string; dateDisplay: string } {
  const now = new Date();

  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayStr = dateFormatter.format(now);

  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "long",
  });
  const dayOfWeek = dayFormatter.format(now);

  const displayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const dateDisplay = displayFormatter.format(now);

  return { todayStr, dayOfWeek, dateDisplay };
}

interface DriverQueryResult {
  id: string;
  vehicle_type: string | null;
  license_plate: string | null;
  phone: string | null;
  profile_image_url: string | null;
  deliveries_count: number;
  rating_avg: number | null;
}

interface ProfileQueryResult {
  full_name: string | null;
}

interface RouteQueryResult {
  id: string;
  status: string;
  stats_json: RouteStats | null;
  started_at: string | null;
}

interface AppSettingResult {
  value: number;
}

async function getDriverData() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?next=/driver");
  }

  // Get driver profile
  const { data: driver, error: driverError } = await supabase
    .from("drivers")
    .select(
      `
      id,
      vehicle_type,
      license_plate,
      phone,
      profile_image_url,
      deliveries_count,
      rating_avg
    `
    )
    .eq("user_id", user.id)
    .eq("is_active", true)
    .returns<DriverQueryResult[]>()
    .single();

  if (driverError || !driver) {
    notFound();
  }

  // Get profile for full name. The last read on this loader that could fail
  // invisibly: it fed `full_name ?? null`, so an RLS or connectivity failure
  // degraded to a nameless greeting with nothing in Sentry. Cosmetic, but it is
  // the same pattern, and leaving one of eight open would make the rule
  // ("a failure must never read as empty") one nobody can rely on.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .returns<ProfileQueryResult[]>()
    .maybeSingle();

  if (profileError) {
    logger.exception(profileError, {
      api: "driver/dashboard",
      flowId: "dashboard-load-profile",
      driverId: driver.id,
    });
  }

  // Get today's date in LA timezone
  const { todayStr, dayOfWeek, dateDisplay } = getDateInfo();

  // Get today's route + gamification + earnings data + next route in parallel
  const [
    routeResult,
    streakResult,
    weeklyResult,
    badgesResult,
    payRateResult,
    todayRoutesResult,
    nextRouteResult,
  ] = await Promise.all([
    supabase
      .from("routes")
      .select("id, status, stats_json, started_at")
      .eq("driver_id", driver.id)
      .eq("delivery_date", todayStr)
      .in("status", ["assigned", "accepted", "planned", "in_progress"])
      // order + limit are load-bearing, not cosmetic. maybeSingle synthesizes
      // PGRST116 when MORE than one row returns, and nothing stops a driver
      // having two active routes on one date: idx_routes_driver_date is a plain
      // non-unique index, and split_route INSERTs a second route at the same
      // delivery_date with a caller-chosen driver (merge_routes exists to undo
      // exactly that). Unbounded, that legitimate shape would log an exception
      // on every dashboard load, all day, while the driver still saw "no route
      // today" — the reporting below poisoning its own signal.
      // A STARTED route wins. `started_at` is set when a driver begins a run,
      // so descending-with-nulls-last surfaces the in-progress one; picking the
      // earliest-created instead could show an untouched `assigned` route to a
      // driver already mid-run. created_at only breaks ties.
      .order("started_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: true })
      .limit(1)
      .returns<RouteQueryResult[]>()
      // maybeSingle, not single: `.single()` returns PGRST116 for ZERO rows, so
      // once errors are actually reported it would fire on every legitimately
      // empty day. maybeSingle gives {data:null,error:null} for no rows, so a
      // genuine error stays a genuine error and can be logged below.
      //
      // Note this is NOT what hid the phantom column — an unknown column is a
      // 400 / Postgres 42703, always distinguishable. Nothing was BINDING the
      // error. maybeSingle is what makes binding it safe.
      .maybeSingle(),
    supabase.rpc("calculate_driver_streak", { p_driver_id: driver.id }),
    supabase.rpc("calculate_driver_weekly_deliveries", { p_driver_id: driver.id }),
    supabase
      .from("driver_badges")
      .select("id, badge_type, name, icon, earned_at")
      .eq("driver_id", driver.id)
      .order("earned_at", { ascending: false })
      .returns<DriverBadgesRow[]>(),
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "driver_pay_per_stop_cents")
      .returns<AppSettingResult[]>()
      // maybeSingle for the same reason as the routes queries, plus one specific
      // to this row: the squashed baseline creates app_settings but seeds NO
      // rows, so `driver_pay_per_stop_cents` is absent on a fresh environment
      // and the documented `?? 500` fallback below is the DESIGNED path. With
      // .single() that legitimate absence is a PGRST116 error, so reporting it
      // would page on every dashboard load; with maybeSingle only a real
      // failure (RLS, connectivity) reaches the loop.
      .maybeSingle(),
    // Today's completed routes with stats for earnings calculation
    supabase
      .from("routes")
      .select("stats_json")
      .eq("driver_id", driver.id)
      .eq("delivery_date", todayStr)
      .eq("status", "completed")
      .returns<{ stats_json: RouteStats | null }[]>(),
    // Next upcoming route after today
    supabase
      .from("routes")
      .select("delivery_date")
      .eq("driver_id", driver.id)
      .gt("delivery_date", todayStr)
      .in("status", ["assigned", "accepted", "planned", "in_progress"])
      .order("delivery_date", { ascending: true })
      .limit(1)
      .returns<{ delivery_date: string }[]>()
      .maybeSingle(),
  ]);

  // Report a failed lookup instead of rendering it as "nothing to show".
  //
  // EVERY read below reaches the view through `?? 0` / `?? []` / `?? null`, so
  // a failure is indistinguishable from an empty day at the UI: no route, $0
  // today, $0 this week, no streak, no badges. That is the exact bug this PR
  // exists to kill — the phantom column was only the instance we happened to
  // find. So the loop covers all seven results rather than the two that were
  // provably broken; each gets its own flowId so Sentry says WHICH read failed.
  //
  // The page still degrades to the empty state — a driver staring at a 404
  // helps nobody — but the failure stops being invisible. This is the runtime
  // half of the fix: the guard test catches a bad column at build time, this
  // catches everything else (an RLS change, a PostgREST quirk, a failed RPC,
  // more than one route matching) at run time.
  for (const [label, result] of [
    ["today", routeResult],
    ["next", nextRouteResult],
    ["earnings", todayRoutesResult],
    ["streak", streakResult],
    ["weekly", weeklyResult],
    ["badges", badgesResult],
    ["pay-rate", payRateResult],
  ] as const) {
    if (result.error) {
      logger.exception(result.error, {
        api: "driver/dashboard",
        flowId: `dashboard-load-${label}`,
        driverId: driver.id,
      });
    }
  }

  const route = routeResult.data;
  const streakDays = (streakResult.data as number) ?? 0;
  const weeklyDeliveries = (weeklyResult.data as number) ?? 0;
  const badges = (badgesResult.data ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    icon: b.icon,
    earnedAt: b.earned_at,
  }));

  // Compute earnings from pay rate and delivery counts
  const rateCents = typeof payRateResult.data?.value === "number" ? payRateResult.data.value : 500;
  const todayDeliveredStops = (todayRoutesResult.data ?? []).reduce(
    (sum, r) => sum + (r.stats_json?.delivered_stops ?? 0),
    0
  );
  const todayEarningsCents = todayDeliveredStops * rateCents;
  const weeklyEarningsCents = weeklyDeliveries * rateCents;

  return {
    driver: {
      id: driver.id,
      fullName: profile?.full_name ?? null,
      phone: driver.phone,
      vehicleType: driver.vehicle_type as VehicleType | null,
      licensePlate: driver.license_plate,
      profileImageUrl: driver.profile_image_url,
      deliveriesCount: driver.deliveries_count,
      ratingAvg: driver.rating_avg,
    },
    todayRoute: route
      ? {
          id: route.id,
          status: route.status as RoutesRow["status"],
          stopCount: route.stats_json?.total_stops ?? 0,
          deliveredCount: route.stats_json?.delivered_stops ?? 0,
          pendingCount: route.stats_json?.pending_stops ?? 0,
          totalDurationMinutes: route.stats_json?.total_duration_minutes ?? null,
          startedAt: route.started_at,
        }
      : null,
    nextRouteDate: nextRouteResult.data?.delivery_date ?? null,
    streakDays,
    todayEarningsCents,
    weeklyEarningsCents,
    badges,
    dayOfWeek,
    dateDisplay,
  };
}

function DriverHomeLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-secondary to-surface-tertiary/30">
      <div className="px-4 py-6 space-y-6">
        {/* Greeting skeleton */}
        <div className="space-y-2">
          <Skeleton width={200} height={28} radius="lg" variant="shimmer" />
          <Skeleton width={140} height={20} radius="md" variant="shimmer" />
        </div>

        {/* Route card skeleton */}
        <div className="rounded-2xl bg-surface-primary p-6 shadow-card border border-border space-y-4">
          <Skeleton width={140} height={24} radius="md" variant="shimmer" />
          <Skeleton width={200} height={16} radius="md" variant="shimmer" />
          <Skeleton width="100%" height={12} radius="full" variant="shimmer" />
          <Skeleton width="100%" height={48} radius="xl" variant="shimmer" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-surface-primary p-4 shadow-card border border-border space-y-2"
            >
              <Skeleton width={48} height={32} radius="md" variant="shimmer" />
              <Skeleton width={80} height={16} radius="md" variant="shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function DriverHomePage() {
  return (
    <Suspense fallback={<DriverHomeLoading />}>
      <DriverHomePageContent />
    </Suspense>
  );
}

async function DriverHomePageContent() {
  const data = await getDriverData();

  return <DriverHomeSwitch {...data} />;
}
