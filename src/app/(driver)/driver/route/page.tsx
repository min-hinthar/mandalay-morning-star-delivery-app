import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DriverHeader } from "@/components/driver/DriverHeader";
import { ActiveRouteView } from "@/components/driver/ActiveRouteView";
import type { RouteStats, RouteStopStatus } from "@/types/driver";

const TIMEZONE = "America/Los_Angeles";

function getTodayInTimezone(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

interface DriverQueryResult {
  id: string;
}

async function getActiveRoute() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?next=/driver/route");
  }

  // Get driver
  const { data: driver } = await supabase
    .from("drivers")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .returns<DriverQueryResult[]>()
    .single();

  if (!driver) {
    redirect("/?error=not_driver");
  }

  // Get today's date in LA timezone
  const todayStr = getTodayInTimezone();

  // Get today's route with stops
  interface RouteQueryResult {
    id: string;
    delivery_date: string;
    status: string;
    stats_json: RouteStats | null;
    started_at: string | null;
    optimized_polyline: string | null;
  }

  const { data: route } = await supabase
    .from("routes")
    .select(`
      id,
      delivery_date,
      status,
      stats_json,
      started_at,
      optimized_polyline
    `)
    .eq("driver_id", driver.id)
    .eq("delivery_date", todayStr)
    .in("status", ["planned", "in_progress"])
    .returns<RouteQueryResult[]>()
    .single();

  if (!route) {
    return { route: null, stops: [], driverId: driver.id };
  }

  // Get stops for this route
  interface StopQueryResult {
    id: string;
    stop_index: number;
    status: RouteStopStatus;
    eta: string | null;
    order: {
      id: string;
      delivery_window_start: string | null;
      delivery_window_end: string | null;
      customer: {
        full_name: string | null;
      };
      address: {
        line1: string;
        line2: string | null;
        city: string;
        state: string;
      };
    };
  }

  const { data: stops } = await supabase
    .from("route_stops")
    .select(`
      id,
      stop_index,
      status,
      eta,
      order:orders (
        id,
        delivery_window_start,
        delivery_window_end,
        customer:profiles!orders_customer_id_fkey (
          full_name
        ),
        address:addresses!orders_delivery_address_id_fkey (
          line1,
          line2,
          city,
          state
        )
      )
    `)
    .eq("route_id", route.id)
    .order("stop_index", { ascending: true })
    .returns<StopQueryResult[]>();

  // Transform stops data for the component
  const transformedStops = (stops ?? []).map((stop) => ({
    id: stop.id,
    stopIndex: stop.stop_index,
    status: stop.status,
    eta: stop.eta,
    order: {
      id: stop.order?.id ?? "",
      deliveryWindowStart: stop.order?.delivery_window_start ?? null,
      deliveryWindowEnd: stop.order?.delivery_window_end ?? null,
      customer: {
        fullName: stop.order?.customer?.full_name ?? null,
      },
      address: {
        line1: stop.order?.address?.line1 ?? "",
        line2: stop.order?.address?.line2 ?? null,
        city: stop.order?.address?.city ?? "",
        state: stop.order?.address?.state ?? "",
      },
    },
  }));

  return { route, stops: transformedStops, driverId: driver.id };
}

function RouteLoading() {
  return (
    <div className="min-h-screen bg-cream">
      <DriverHeader title="Route" showBack backHref="/driver" />
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {/* Progress bar skeleton */}
          <div className="h-4 w-full rounded-full bg-charcoal/10" />

          {/* Current stop skeleton */}
          <div className="rounded-2xl bg-white p-4 shadow-warm-md">
            <div className="mb-3 h-5 w-32 rounded bg-charcoal/10" />
            <div className="mb-2 h-4 w-48 rounded bg-charcoal/10" />
            <div className="h-4 w-64 rounded bg-charcoal/10" />
          </div>

          {/* Upcoming stops skeleton */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl bg-white p-3 shadow-warm-sm">
              <div className="mb-2 h-4 w-24 rounded bg-charcoal/10" />
              <div className="h-3 w-40 rounded bg-charcoal/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function DriverRoutePage() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <DriverRoutePageContent />
    </Suspense>
  );
}

async function DriverRoutePageContent() {
  const { route, stops } = await getActiveRoute();

  if (!route) {
    return (
      <div className="min-h-screen bg-cream">
        <DriverHeader title="Route" showBack backHref="/driver" />
        <div className="flex flex-col items-center justify-center px-4 py-16">
          <div className="text-center">
            <h2 className="mb-2 font-display text-xl font-semibold text-charcoal">
              No Active Route
            </h2>
            <p className="text-charcoal/60">
              You don&apos;t have a route assigned for today.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const deliveredCount = stops.filter((s) => s.status === "delivered").length;
  const totalCount = stops.length;

  return (
    <div className="min-h-screen bg-cream pb-20">
      <DriverHeader
        title="Route"
        subtitle={`${deliveredCount}/${totalCount} Complete`}
        showBack
        backHref="/driver"
      />
      <div className="p-4">
        <ActiveRouteView
          routeId={route.id}
          routeStatus={route.status}
          stops={stops}
        />
      </div>
    </div>
  );
}
