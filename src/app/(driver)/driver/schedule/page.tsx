import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { checkSimpleMode } from "@/lib/driver/simple-mode-guard";
import { Skeleton } from "@/components/ui/skeleton/base";
import { SchedulePageClient } from "./SchedulePageClient";
import type { RouteStats } from "@/types/driver";
import type { DriverAvailability } from "@/types/driver";
import type { HistoryRouteData } from "@/components/ui/driver/DriverDashboard/HistorySummaryCard";
import { TIMEZONE } from "@/types/delivery";

interface DriverQueryResult {
  id: string;
  availability_json: DriverAvailability | null;
}

interface RouteQueryResult {
  id: string;
  delivery_date: string;
  status: string;
  stats_json: RouteStats | null;
  started_at: string | null;
}

interface StopQueryResult {
  id: string;
  status: string;
  route_id: string;
  orders: {
    addresses: {
      line_1: string;
      city: string;
    } | null;
  } | null;
}

async function getScheduleData() {
  const { id: driverId } = await checkSimpleMode();

  const supabase = await createClient();

  const { data: driver } = await supabase
    .from("drivers")
    .select("id, availability_json")
    .eq("id", driverId)
    .returns<DriverQueryResult[]>()
    .single();

  if (!driver) {
    return { routes: [] as HistoryRouteData[], availability: null };
  }

  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  // Get upcoming routes
  const { data: routes } = await supabase
    .from("routes")
    .select("id, delivery_date, status, stats_json, started_at")
    .eq("driver_id", driver.id)
    .gte("delivery_date", todayStr)
    .in("status", ["assigned", "accepted", "planned", "in_progress"])
    .order("delivery_date", { ascending: true })
    .limit(14)
    .returns<RouteQueryResult[]>();

  if (!routes || routes.length === 0) {
    return {
      routes: [] as HistoryRouteData[],
      availability: (driver.availability_json as DriverAvailability | null) ?? null,
    };
  }

  // Get stops for all routes
  const routeIds = routes.map((r) => r.id);
  const { data: stops } = await supabase
    .from("route_stops")
    .select("id, status, route_id, orders(addresses(line_1, city))")
    .in("route_id", routeIds)
    .order("stop_index", { ascending: true })
    .returns<StopQueryResult[]>();

  const stopsByRoute = new Map<string, StopQueryResult[]>();
  for (const stop of stops ?? []) {
    const existing = stopsByRoute.get(stop.route_id) ?? [];
    existing.push(stop);
    stopsByRoute.set(stop.route_id, existing);
  }

  const transformedRoutes: HistoryRouteData[] = routes.map((route) => {
    const routeStops = stopsByRoute.get(route.id) ?? [];
    return {
      id: route.id,
      date: route.delivery_date,
      stopCount: route.stats_json?.total_stops ?? routeStops.length,
      deliveredCount: route.stats_json?.delivered_stops ?? 0,
      onTimePercentage: route.stats_json?.completion_rate ?? 0,
      totalDurationMinutes: route.stats_json?.total_duration_minutes ?? null,
      stops: routeStops.map((stop) => ({
        id: stop.id,
        status: stop.status,
        address: stop.orders?.addresses
          ? `${stop.orders.addresses.line_1}, ${stop.orders.addresses.city}`
          : "Unknown address",
        deliveredAt: null,
      })),
    };
  });

  return {
    routes: transformedRoutes,
    availability: (driver.availability_json as DriverAvailability | null) ?? null,
  };
}

function ScheduleLoading() {
  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Skeleton width={24} height={24} radius="md" variant="shimmer" />
        <Skeleton width={120} height={28} radius="md" variant="shimmer" />
      </div>
      <Skeleton width="100%" height={60} radius="xl" variant="shimmer" />
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} width="100%" height={80} radius="xl" variant="shimmer" />
        ))}
      </div>
    </div>
  );
}

export default async function SchedulePage() {
  return (
    <Suspense fallback={<ScheduleLoading />}>
      <SchedulePageContent />
    </Suspense>
  );
}

async function SchedulePageContent() {
  const { routes, availability } = await getScheduleData();
  return <SchedulePageClient routes={routes} availability={availability} />;
}
