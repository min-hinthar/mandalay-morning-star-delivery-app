"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { m } from "framer-motion";
import { format, startOfDay, parseISO, addDays, subDays } from "date-fns";
import { RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/hooks/useToastV8";
import { useAnimationPreference } from "@/lib/hooks";
import { RouteListTable, type AdminRoute } from "@/components/ui/admin/routes/RouteListTable";
import {
  CreateRouteModal,
  type CreateRouteData,
} from "@/components/ui/admin/routes/CreateRouteModal";
import { AdminPageHeader } from "@/components/ui/admin/AdminPageHeader";
import { SkeletonCrossfade } from "@/components/ui/admin/SkeletonCrossfade";
import { InlineErrorCard } from "@/components/ui/admin/InlineErrorCard";
import { RoutesPageSkeleton } from "@/components/ui/admin/routes/RouteListTable/RoutesPageSkeleton";
import type { RouteStatus } from "@/types/driver";
import { RoutesStatsCards } from "./RoutesStatsCards";
import { RoutePageHeader, type StatusFilter } from "./RoutePageHeader";

export default function AdminRoutesPage() {
  const { shouldAnimate } = useAnimationPreference();
  const router = useRouter();
  const [routes, setRoutes] = useState<AdminRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchRoutes = useCallback(async () => {
    try {
      setError(null);
      let url = "/api/admin/routes";
      if (selectedDate) {
        url += `?date=${selectedDate}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch routes");
      }
      const json = await response.json();
      const data: AdminRoute[] = json.data ?? json;
      setRoutes(data);
    } catch {
      setError("Failed to load routes. Please try again.");
      toast({ message: "Failed to fetch routes", type: "error" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRoutes();
  };

  const handleViewRoute = (routeId: string) => {
    router.push(`/admin/routes/${routeId}`);
  };

  const handleStatusChange = async (routeId: string, status: RouteStatus) => {
    try {
      const response = await fetch(`/api/admin/routes/${routeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to update route");
      }

      await fetchRoutes();
      router.refresh();
    } catch (err) {
      toast({
        message: err instanceof Error ? err.message : "Failed to update route",
        type: "error",
      });
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    try {
      const response = await fetch(`/api/admin/routes/${routeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to delete route");
      }

      setRoutes((prev) => prev.filter((r) => r.id !== routeId));
      router.refresh();
    } catch (err) {
      toast({
        message: err instanceof Error ? err.message : "Failed to delete route",
        type: "error",
      });
    }
  };

  const handleCreateRoute = async (data: CreateRouteData) => {
    const response = await fetch("/api/admin/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to create route");
    }

    await fetchRoutes();
  };

  const goToPreviousDay = () => {
    const current = selectedDate ? parseISO(selectedDate) : startOfDay(new Date());
    setSelectedDate(format(subDays(current, 1), "yyyy-MM-dd"));
  };

  const goToNextDay = () => {
    const current = selectedDate ? parseISO(selectedDate) : startOfDay(new Date());
    setSelectedDate(format(addDays(current, 1), "yyyy-MM-dd"));
  };

  const goToToday = () => {
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  const filteredRoutes =
    statusFilter === "all" ? routes : routes.filter((route) => route.status === statusFilter);

  const stats = {
    total: routes.length,
    planned: routes.filter((r) => r.status === "planned").length,
    assigned: routes.filter((r) => r.status === "assigned").length,
    accepted: routes.filter((r) => r.status === "accepted").length,
    inProgress: routes.filter((r) => r.status === "in_progress").length,
    completed: routes.filter((r) => r.status === "completed").length,
    totalStops: routes.reduce((sum, r) => sum + r.stopCount, 0),
    deliveredStops: routes.reduce((sum, r) => sum + r.deliveredCount, 0),
  };

  const statusCounts = {
    all: routes.length,
    planned: stats.planned,
    assigned: stats.assigned,
    accepted: stats.accepted,
    in_progress: stats.inProgress,
    completed: stats.completed,
  };

  return (
    <SkeletonCrossfade isLoading={loading} skeleton={<RoutesPageSkeleton />}>
      <div className="p-4 md:p-8 space-y-6">
        {/* Header with AdminPageHeader */}
        <AdminPageHeader
          title="Routes"
          count={routes.length}
          breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Routes" }]}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-accent-teal/20 hover:bg-accent-teal/5"
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
                Refresh
              </Button>
              <Button
                asChild
                className="bg-accent-teal hover:bg-accent-teal/90 text-text-inverse shadow-md"
              >
                <Link href="/admin/routes/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Route
                </Link>
              </Button>
            </div>
          }
        />

        {/* Error state */}
        {error && !loading && <InlineErrorCard message={error} onRetry={handleRefresh} />}

        {/* Stats cards */}
        {!error && (
          <RoutesStatsCards
            total={stats.total}
            planned={stats.planned}
            assigned={stats.assigned}
            accepted={stats.accepted}
            inProgress={stats.inProgress}
            completed={stats.completed}
          />
        )}

        {/* Date nav, status filters, delivery progress */}
        {!error && (
          <RoutePageHeader
            selectedDate={selectedDate}
            statusFilter={statusFilter}
            routeCount={routes.length}
            statusCounts={statusCounts}
            deliveredStops={stats.deliveredStops}
            totalStops={stats.totalStops}
            onPreviousDay={goToPreviousDay}
            onNextDay={goToNextDay}
            onToday={goToToday}
            onClearDate={clearDateFilter}
            onStatusFilterChange={setStatusFilter}
          />
        )}

        {/* Routes Table */}
        {!error && (
          <m.div
            initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <RouteListTable
              routes={filteredRoutes}
              onViewRoute={handleViewRoute}
              onStatusChange={handleStatusChange}
              onDeleteRoute={handleDeleteRoute}
            />
          </m.div>
        )}

        <CreateRouteModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSubmit={handleCreateRoute}
        />
      </div>
    </SkeletonCrossfade>
  );
}
