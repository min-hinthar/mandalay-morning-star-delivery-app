import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeRouteEarnings } from "@/lib/earnings";
import type { DriverBadgesRow } from "@/types/driver";
import { EarningsPageClient } from "./EarningsPageClient";
import EarningsLoading from "./loading";

const DEFAULT_PAY_RATE_CENTS = 500;

interface RouteWithStopsResult {
  id: string;
  delivery_date: string;
  route_stops: Array<{ status: string }>;
}

interface AppSettingResult {
  value: number;
}

interface DriverResult {
  id: string;
  deliveries_count: number;
  rating_avg: number;
}

async function getEarningsData() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?next=/driver/earnings");
  }

  // Get driver record
  const { data: driver } = await supabase
    .from("drivers")
    .select("id, deliveries_count, rating_avg")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .returns<DriverResult[]>()
    .single();

  if (!driver) {
    redirect("/");
  }

  // 12 months of data for maximum range
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12);
  const startDateStr = startDate.toISOString().split("T")[0];

  // Parallel queries
  const [payRateResult, routesResult, badgesResult, streakResult] = await Promise.all([
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "driver_pay_per_stop_cents")
      .returns<AppSettingResult[]>()
      .single(),
    supabase
      .from("routes")
      .select("id, delivery_date, route_stops(status)")
      .eq("driver_id", driver.id)
      .eq("status", "completed")
      .gte("delivery_date", startDateStr)
      .order("delivery_date", { ascending: false })
      .returns<RouteWithStopsResult[]>(),
    supabase
      .from("driver_badges")
      .select("id, badge_type, name, icon, earned_at")
      .eq("driver_id", driver.id)
      .order("earned_at", { ascending: false })
      .returns<DriverBadgesRow[]>(),
    supabase.rpc("calculate_driver_streak", { p_driver_id: driver.id }),
  ]);

  const rateCents =
    typeof payRateResult.data?.value === "number"
      ? payRateResult.data.value
      : DEFAULT_PAY_RATE_CENTS;

  const routes = routesResult.data ?? [];
  const routeEarnings = computeRouteEarnings(routes, rateCents);

  const badges = (badgesResult.data ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    icon: b.icon,
    earnedAt: b.earned_at,
  }));

  const streakDays = (streakResult.data as number) ?? 0;

  return {
    routeEarnings,
    rateCents,
    badges,
    streakDays,
    driverStats: {
      deliveriesCount: driver.deliveries_count,
      ratingAvg: driver.rating_avg,
    },
  };
}

export default async function EarningsPage() {
  return (
    <Suspense fallback={<EarningsLoading />}>
      <EarningsPageContent />
    </Suspense>
  );
}

async function EarningsPageContent() {
  const data = await getEarningsData();
  return <EarningsPageClient {...data} />;
}
