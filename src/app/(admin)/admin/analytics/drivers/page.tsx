/**
 * V2 Sprint 4: Driver Analytics Dashboard Page
 *
 * Shows driver performance metrics, leaderboard, and team summary.
 * Server-rendered with client components for animations.
 */

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ProfileRole } from "@/types/database";
import { DriverAnalyticsDashboard } from "./DriverAnalyticsDashboard";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfileCheck {
  role: ProfileRole;
}

export const metadata = {
  title: "Driver Analytics | Mandalay Morning Star",
  description: "View driver performance metrics and leaderboard",
};

export default async function DriverAnalyticsPage() {
  const supabase = await createClient();

  // Verify admin access
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?next=/admin/analytics/drivers");
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

  return (
    <div className="p-8">
      <Suspense fallback={<DriverAnalyticsSkeleton />}>
        <DriverAnalyticsDashboard />
      </Suspense>
    </div>
  );
}

function DriverAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Metric cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-96 rounded-xl lg:col-span-2" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  );
}
