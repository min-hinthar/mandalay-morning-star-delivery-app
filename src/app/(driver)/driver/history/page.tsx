import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DriverPageHeader } from "@/components/ui/driver/DriverPageHeader";
import { HistorySkeleton } from "@/components/ui/driver/DriverDashboard/HistorySkeleton";
import { DriverHistoryContent } from "./DriverHistoryContent";
import type { RouteStats } from "@/types/driver";

// ============================================
// TYPES
// ============================================

interface DriverQueryResult {
  id: string;
  deliveries_count: number;
  rating_avg: number;
}

interface RouteQueryResult {
  id: string;
  delivery_date: string;
  status: string;
  stats_json: RouteStats | null;
  started_at: string | null;
  completed_at: string | null;
}

interface RouteStopQueryResult {
  id: string;
  route_id: string;
  status: string;
  delivered_at: string | null;
  order_id: string;
}

interface OrderDeliveryWindow {
  id: string;
  delivery_window_end: string | null;
}

// ============================================
// DATA FETCHING
// ============================================

async function getDriverHistory() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?next=/driver/history");
  }

  const { data: driver } = await supabase
    .from("drivers")
    .select("id, deliveries_count, rating_avg")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .returns<DriverQueryResult[]>()
    .single();

  if (!driver) {
    redirect("/?error=not_driver");
  }

  // Get total count + initial batch of completed routes
  const [{ count: totalCount }, { data: routes }] = await Promise.all([
    supabase
      .from("routes")
      .select("id", { count: "exact", head: true })
      .eq("driver_id", driver.id)
      .eq("status", "completed"),
    supabase
      .from("routes")
      .select("id, delivery_date, status, stats_json, started_at, completed_at")
      .eq("driver_id", driver.id)
      .eq("status", "completed")
      .order("delivery_date", { ascending: false })
      .limit(20)
      .returns<RouteQueryResult[]>(),
  ]);

  const routeList = routes ?? [];
  const routeIds = routeList.map((r) => r.id);

  // Fetch route_stops for all routes to compute real on-time %
  const stopsByRoute: Record<string, RouteStopQueryResult[]> = {};
  const orderWindowMap: Record<string, string | null> = {};

  if (routeIds.length > 0) {
    const { data: stops } = await supabase
      .from("route_stops")
      .select("id, route_id, status, delivered_at, order_id")
      .in("route_id", routeIds)
      .returns<RouteStopQueryResult[]>();

    if (stops) {
      for (const stop of stops) {
        if (!stopsByRoute[stop.route_id]) {
          stopsByRoute[stop.route_id] = [];
        }
        stopsByRoute[stop.route_id].push(stop);
      }

      // Fetch delivery windows for orders in delivered stops
      const deliveredOrderIds = stops
        .filter((s) => s.status === "delivered" && s.delivered_at)
        .map((s) => s.order_id);

      if (deliveredOrderIds.length > 0) {
        const { data: orders } = await supabase
          .from("orders")
          .select("id, delivery_window_end")
          .in("id", deliveredOrderIds)
          .returns<OrderDeliveryWindow[]>();

        if (orders) {
          for (const order of orders) {
            orderWindowMap[order.id] = order.delivery_window_end;
          }
        }
      }
    }
  }

  // Compute real on-time percentage per route and overall
  let totalDelivered = 0;
  let totalOnTime = 0;

  const routeData = routeList.map((route) => {
    const stops = stopsByRoute[route.id] ?? [];
    const deliveredStops = stops.filter((s) => s.status === "delivered");
    let routeOnTime = 0;

    for (const stop of deliveredStops) {
      const windowEnd = orderWindowMap[stop.order_id];
      if (stop.delivered_at && windowEnd) {
        // Compare delivered_at against delivery_window_end
        const deliveredTime = new Date(stop.delivered_at).getTime();
        const windowEndTime = new Date(windowEnd).getTime();
        if (deliveredTime <= windowEndTime) {
          routeOnTime++;
        }
      } else {
        // No delivery window data -- assume on-time (best effort)
        routeOnTime++;
      }
    }

    totalDelivered += deliveredStops.length;
    totalOnTime += routeOnTime;

    const routeOnTimePct =
      deliveredStops.length > 0 ? Math.round((routeOnTime / deliveredStops.length) * 100) : 0;

    return {
      id: route.id,
      date: route.delivery_date,
      stopCount: route.stats_json?.total_stops ?? stops.length,
      deliveredCount: deliveredStops.length,
      onTimePercentage: routeOnTimePct,
      totalDurationMinutes: route.stats_json?.total_duration_minutes ?? null,
      startedAt: route.started_at,
      completedAt: route.completed_at,
      stops: stops.map((s) => ({
        id: s.id,
        status: s.status,
        address: "", // Addresses fetched client-side if needed
        deliveredAt: s.delivered_at,
      })),
    };
  });

  const overallOnTime = totalDelivered > 0 ? Math.round((totalOnTime / totalDelivered) * 100) : 0;

  return {
    driver: {
      deliveriesCount: driver.deliveries_count,
      ratingAvg: driver.rating_avg,
      onTimePercentage: overallOnTime,
    },
    routes: routeData,
    totalRoutes: totalCount ?? routeList.length,
  };
}

// ============================================
// PAGE
// ============================================

export default async function DriverHistoryPage() {
  return (
    <div className="min-h-screen bg-surface-secondary">
      <DriverPageHeader title="Delivery History" showBack backHref="/driver" />
      <Suspense fallback={<HistorySkeleton />}>
        <DriverHistoryPageContent />
      </Suspense>
    </div>
  );
}

async function DriverHistoryPageContent() {
  const { driver, routes, totalRoutes } = await getDriverHistory();

  return <DriverHistoryContent driver={driver} routes={routes} totalRoutes={totalRoutes} />;
}
