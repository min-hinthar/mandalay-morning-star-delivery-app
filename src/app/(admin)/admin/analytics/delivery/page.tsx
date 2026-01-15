/**
 * V2 Sprint 4: Delivery Metrics Dashboard Page
 *
 * Shows delivery KPIs, success rates, peak hours, and exceptions.
 * Server-rendered with client components for animations.
 */

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ProfileRole } from "@/types/database";
import { DeliveryMetricsDashboard } from "./DeliveryMetricsDashboard";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfileCheck {
  role: ProfileRole;
}

export const metadata = {
  title: "Delivery Metrics | Mandalay Morning Star",
  description: "View delivery performance and operational metrics",
};

export default async function DeliveryMetricsPage() {
  const supabase = await createClient();

  // Verify admin access
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?next=/admin/analytics/delivery");
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
      <Suspense fallback={<DeliveryMetricsSkeleton />}>
        <DeliveryMetricsDashboard />
      </Suspense>
    </div>
  );
}

function DeliveryMetricsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Metric cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}
