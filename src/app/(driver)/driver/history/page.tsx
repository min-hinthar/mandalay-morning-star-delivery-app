import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DriverHeader } from "@/components/driver/DriverHeader";
import type { RouteStats } from "@/types/driver";
import { CheckCircle, Clock, MapPin, TrendingUp, Star } from "lucide-react";

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

async function getDriverHistory() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?next=/driver/history");
  }

  // Get driver
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

  // Get past completed routes
  const { data: routes } = await supabase
    .from("routes")
    .select("id, delivery_date, status, stats_json, started_at, completed_at")
    .eq("driver_id", driver.id)
    .eq("status", "completed")
    .order("delivery_date", { ascending: false })
    .limit(20)
    .returns<RouteQueryResult[]>();

  // Calculate on-time percentage (mock for now - would need delivery window data)
  const onTimePercentage = 98;

  return {
    driver: {
      deliveriesCount: driver.deliveries_count,
      ratingAvg: driver.rating_avg,
      onTimePercentage,
    },
    routes: routes ?? [],
  };
}

function HistoryLoading() {
  return (
    <div className="min-h-screen bg-cream">
      <DriverHeader title="Delivery History" showBack backHref="/driver" />
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {/* Stats skeleton */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-white p-3 shadow-warm-sm">
                <div className="mb-2 h-6 w-10 rounded bg-charcoal/10" />
                <div className="h-3 w-16 rounded bg-charcoal/10" />
              </div>
            ))}
          </div>

          {/* Routes skeleton */}
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-white p-4 shadow-warm-sm">
                <div className="mb-2 h-4 w-32 rounded bg-charcoal/10" />
                <div className="h-3 w-24 rounded bg-charcoal/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function DriverHistoryPage() {
  return (
    <Suspense fallback={<HistoryLoading />}>
      <DriverHistoryPageContent />
    </Suspense>
  );
}

async function DriverHistoryPageContent() {
  const { driver, routes } = await getDriverHistory();

  return (
    <div className="min-h-screen bg-cream">
      <DriverHeader title="Delivery History" showBack backHref="/driver" />

      <div className="p-4">
        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white p-3 text-center shadow-warm-sm">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4 text-jade-500" />
              <span className="text-xl font-bold text-charcoal">
                {driver.deliveriesCount}
              </span>
            </div>
            <p className="text-xs text-charcoal/60">Deliveries</p>
          </div>

          <div className="rounded-xl bg-white p-3 text-center shadow-warm-sm">
            <div className="flex items-center justify-center gap-1">
              <Star className="h-4 w-4 text-saffron-500" />
              <span className="text-xl font-bold text-charcoal">
                {driver.ratingAvg.toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-charcoal/60">Rating</p>
          </div>

          <div className="rounded-xl bg-white p-3 text-center shadow-warm-sm">
            <div className="flex items-center justify-center gap-1">
              <Clock className="h-4 w-4 text-jade-500" />
              <span className="text-xl font-bold text-charcoal">
                {driver.onTimePercentage}%
              </span>
            </div>
            <p className="text-xs text-charcoal/60">On Time</p>
          </div>
        </div>

        {/* Past Routes */}
        <h2 className="mb-3 font-display text-lg font-semibold text-charcoal">
          Past Routes
        </h2>

        {routes.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-warm-sm">
            <p className="text-charcoal/60">No completed routes yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {routes.map((route) => {
              const stats = route.stats_json;
              const deliveryDate = new Date(route.delivery_date + "T00:00:00");
              const durationMinutes = stats?.total_duration_minutes;
              const hours = durationMinutes
                ? (durationMinutes / 60).toFixed(1)
                : null;

              const dateFormatter = new Intl.DateTimeFormat("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div
                  key={route.id}
                  className="rounded-xl bg-white p-4 shadow-warm-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-charcoal">
                        {dateFormatter.format(deliveryDate)}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-sm text-charcoal/60">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {stats?.total_stops ?? 0} stops
                        </span>
                        {hours && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {hours} hrs
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-jade-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">Completed</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
