import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { DriverHomeSwitch } from "./DriverHomeSwitch";
import { Skeleton } from "@/components/ui/skeleton/base";
import type { RoutesRow, RouteStats, VehicleType, DriverBadgesRow } from "@/types/driver";

const TIMEZONE = "America/Los_Angeles";

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
  rating_avg: number;
}

interface ProfileQueryResult {
  full_name: string | null;
}

interface RouteQueryResult {
  id: string;
  status: string;
  stats_json: RouteStats | null;
  started_at: string | null;
  optimized_polyline: string | null;
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

  // Get profile for full name
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .returns<ProfileQueryResult[]>()
    .single();

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
      .select("id, status, stats_json, started_at, optimized_polyline")
      .eq("driver_id", driver.id)
      .eq("delivery_date", todayStr)
      .in("status", ["planned", "in_progress"])
      .returns<RouteQueryResult[]>()
      .single(),
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
      .single(),
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
      .in("status", ["planned", "in_progress"])
      .order("delivery_date", { ascending: true })
      .limit(1)
      .returns<{ delivery_date: string }[]>()
      .single(),
  ]);

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
