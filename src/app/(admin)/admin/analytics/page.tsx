/**
 * V2 Sprint 4: Analytics Landing Page
 *
 * Overview page with quick stats and links to
 * Driver Analytics and Delivery Metrics dashboards.
 */

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Truck,
  TrendingUp,
  Star,
  ChevronRight,
  Package,
  Clock,
} from "lucide-react";
import type { ProfileRole } from "@/types/database";

interface ProfileCheck {
  role: ProfileRole;
}

interface RatingRow {
  rating: number;
}

export const metadata = {
  title: "Analytics | Mandalay Morning Star",
  description: "View performance analytics and metrics",
};

export default async function AnalyticsPage() {
  const supabase = await createClient();

  // Verify admin access
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?next=/admin/analytics");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .returns<ProfileCheck[]>()
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/?error=unauthorized");
  }

  // Fetch quick stats
  const [driversResult, routesResult, ratingsResult] = await Promise.all([
    supabase
      .from("drivers")
      .select("id", { count: "exact" })
      .eq("is_active", true),
    supabase
      .from("routes")
      .select("id", { count: "exact" })
      .eq("status", "completed"),
    supabase
      .from("driver_ratings")
      .select("rating")
      .returns<RatingRow[]>(),
  ]);

  const activeDrivers = driversResult.count ?? 0;
  const completedRoutes = routesResult.count ?? 0;
  const ratings = ratingsResult.data ?? [];
  const avgRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : null;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display text-charcoal">Analytics</h1>
        <p className="text-muted-foreground">
          Monitor your delivery operations and driver performance
        </p>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
            <Users className="h-4 w-4 text-saffron" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDrivers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Routes</CardTitle>
            <Truck className="h-4 w-4 text-jade" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedRoutes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-saffron" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgRating !== null ? avgRating.toFixed(1) : "N/A"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ratings</CardTitle>
            <TrendingUp className="h-4 w-4 text-curry" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ratings.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Links */}
      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/admin/analytics/drivers">
          <Card className="transition-all hover:border-saffron hover:shadow-warm-md cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-xl bg-saffron/10 p-4">
                <Users className="h-8 w-8 text-saffron" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-charcoal">
                  Driver Analytics
                </h2>
                <p className="text-sm text-muted-foreground">
                  Performance metrics, leaderboard, and ratings
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-charcoal-400" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/analytics/delivery">
          <Card className="transition-all hover:border-jade hover:shadow-warm-md cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-xl bg-jade/10 p-4">
                <Package className="h-8 w-8 text-jade" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-charcoal">
                  Delivery Metrics
                </h2>
                <p className="text-sm text-muted-foreground">
                  Success rates, peak hours, and exceptions
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-charcoal-400" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Coming Soon Section */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-charcoal">
          Quick Insights
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-dashed">
            <CardContent className="flex items-center gap-3 p-4">
              <Clock className="h-5 w-5 text-charcoal-400" />
              <div>
                <p className="font-medium text-charcoal">Peak Hours</p>
                <p className="text-sm text-muted-foreground">
                  View in Delivery Metrics →
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="flex items-center gap-3 p-4">
              <Star className="h-5 w-5 text-charcoal-400" />
              <div>
                <p className="font-medium text-charcoal">Top Performers</p>
                <p className="text-sm text-muted-foreground">
                  View in Driver Analytics →
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="flex items-center gap-3 p-4">
              <TrendingUp className="h-5 w-5 text-charcoal-400" />
              <div>
                <p className="font-medium text-charcoal">Trends</p>
                <p className="text-sm text-muted-foreground">
                  Compare performance over time
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
