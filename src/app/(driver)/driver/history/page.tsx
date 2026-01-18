import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DriverPageHeader } from "@/components/driver/DriverPageHeader";
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
    <div className="min-h-screen bg-surface-secondary">
      <DriverPageHeader title="Delivery History" showBack backHref="/driver" />
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {/* Stats skeleton */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-surface-primary p-3 shadow-sm">
                <div className="mb-2 h-6 w-10 rounded bg-text-secondary/10" />
                <div className="h-3 w-16 rounded bg-text-secondary/10" />
              </div>
            ))}
          </div>

          {/* Routes skeleton */}
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-surface-primary p-4 shadow-sm">
                <div className="mb-2 h-4 w-32 rounded bg-text-secondary/10" />
                <div className="h-3 w-24 rounded bg-text-secondary/10" />
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
    <div className="min-h-screen bg-surface-secondary">
      <DriverPageHeader title="Delivery History" showBack backHref="/driver" />

      <div className="p-4">
        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-surface-primary p-3 text-center shadow-sm">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4 text-status-success" />
              <span className="text-xl font-bold text-text-primary">
                {driver.deliveriesCount}
              </span>
            </div>
            <p className="text-xs text-text-secondary">Deliveries</p>
          </div>

          <div className="rounded-xl bg-surface-primary p-3 text-center shadow-sm">
            <div className="flex items-center justify-center gap-1">
              <Star className="h-4 w-4 text-interactive-primary" />
              <span className="text-xl font-bold text-text-primary">
                {driver.ratingAvg.toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-text-secondary">Rating</p>
          </div>

          <div className="rounded-xl bg-surface-primary p-3 text-center shadow-sm">
            <div className="flex items-center justify-center gap-1">
              <Clock className="h-4 w-4 text-status-success" />
              <span className="text-xl font-bold text-text-primary">
                {driver.onTimePercentage}%
              </span>
            </div>
            <p className="text-xs text-text-secondary">On Time</p>
          </div>
        </div>

        {/* Past Routes */}
        <h2 className="mb-3 font-display text-lg font-semibold text-text-primary">
          Past Routes
        </h2>

        {routes.length === 0 ? (
          <div className="rounded-xl bg-surface-primary p-8 text-center shadow-sm">
            <p className="text-text-secondary">No completed routes yet</p>
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
                  className="rounded-xl bg-surface-primary p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-text-primary">
                        {dateFormatter.format(deliveryDate)}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-sm text-text-secondary">
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
                    <div className="flex items-center gap-1 text-status-success">
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
