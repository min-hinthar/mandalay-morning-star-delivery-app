import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DriverDashboard } from "@/components/driver/v7-index";
import type { RoutesRow, RouteStats, VehicleType } from "@/types/driver";

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

async function getDriverData() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?next=/driver");
  }

  // Get driver profile
  const { data: driver, error: driverError } = await supabase
    .from("drivers")
    .select(`
      id,
      vehicle_type,
      phone,
      profile_image_url,
      deliveries_count,
      rating_avg
    `)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .returns<DriverQueryResult[]>()
    .single();

  if (driverError || !driver) {
    redirect("/?error=not_driver");
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

  // Get today's route for this driver
  const { data: route } = await supabase
    .from("routes")
    .select("id, status, stats_json, started_at, optimized_polyline")
    .eq("driver_id", driver.id)
    .eq("delivery_date", todayStr)
    .in("status", ["planned", "in_progress"])
    .returns<RouteQueryResult[]>()
    .single();

  return {
    driver: {
      id: driver.id,
      fullName: profile?.full_name ?? null,
      phone: driver.phone,
      vehicleType: driver.vehicle_type as VehicleType | null,
      profileImageUrl: driver.profile_image_url,
      deliveriesCount: driver.deliveries_count,
      ratingAvg: driver.rating_avg,
    },
    todayRoute: route ? {
      id: route.id,
      status: route.status as RoutesRow["status"],
      stopCount: route.stats_json?.total_stops ?? 0,
      deliveredCount: route.stats_json?.delivered_stops ?? 0,
      pendingCount: route.stats_json?.pending_stops ?? 0,
      totalDurationMinutes: route.stats_json?.total_duration_minutes ?? null,
      startedAt: route.started_at,
    } : null,
    dayOfWeek,
    dateDisplay,
  };
}

function DriverHomeLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-secondary to-surface-tertiary/30">
      <div className="px-4 py-6">
        {/* Greeting skeleton */}
        <div className="mb-6 animate-pulse">
          <div className="mb-1 h-8 w-48 rounded-input bg-surface-tertiary" />
          <div className="h-5 w-32 rounded-input bg-surface-tertiary" />
        </div>

        {/* Route card skeleton */}
        <div className="animate-pulse rounded-card bg-surface-primary p-6 shadow-md">
          <div className="mb-4 h-6 w-32 rounded-input bg-surface-tertiary" />
          <div className="mb-4 h-4 w-48 rounded-input bg-surface-tertiary" />
          <div className="mb-6 h-3 w-full rounded-full bg-surface-tertiary" />
          <div className="h-14 w-full rounded-card-sm bg-surface-tertiary" />
        </div>

        {/* Stats skeleton */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="animate-pulse rounded-card-sm bg-surface-primary p-4 shadow-sm">
            <div className="mb-2 h-8 w-12 rounded-input bg-surface-tertiary" />
            <div className="h-4 w-20 rounded-input bg-surface-tertiary" />
          </div>
          <div className="animate-pulse rounded-card-sm bg-surface-primary p-4 shadow-sm">
            <div className="mb-2 h-8 w-12 rounded-input bg-surface-tertiary" />
            <div className="h-4 w-20 rounded-input bg-surface-tertiary" />
          </div>
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

  return <DriverDashboard {...data} />;
}
