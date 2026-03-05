"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { m } from "framer-motion";
import { format, startOfDay, parseISO, nextSaturday, previousSaturday, isSaturday } from "date-fns";
import { RefreshCw, Plus, Filter, MapPin, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/hooks/useToastV8";
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

type StatusFilter = "all" | RouteStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Routes" },
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export default function AdminRoutesPage() {
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

  const goToPreviousSaturday = () => {
    const current = selectedDate ? parseISO(selectedDate) : startOfDay(new Date());
    setSelectedDate(format(previousSaturday(current), "yyyy-MM-dd"));
  };

  const goToNextSaturday = () => {
    const current = selectedDate ? parseISO(selectedDate) : startOfDay(new Date());
    setSelectedDate(format(nextSaturday(current), "yyyy-MM-dd"));
  };

  const goToThisSaturday = () => {
    const today = new Date();
    const target = isSaturday(today) ? today : nextSaturday(today);
    setSelectedDate(format(target, "yyyy-MM-dd"));
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  const filteredRoutes =
    statusFilter === "all" ? routes : routes.filter((route) => route.status === statusFilter);

  const stats = {
    total: routes.length,
    planned: routes.filter((r) => r.status === "planned").length,
    inProgress: routes.filter((r) => r.status === "in_progress").length,
    completed: routes.filter((r) => r.status === "completed").length,
    totalStops: routes.reduce((sum, r) => sum + r.stopCount, 0),
    deliveredStops: routes.reduce((sum, r) => sum + r.deliveredCount, 0),
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
            <div className="flex items-center gap-2">
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
            inProgress={stats.inProgress}
            completed={stats.completed}
          />
        )}

        {/* Date Navigation & Status Filters */}
        {!error && (
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
          >
            <div className="flex items-center gap-2 bg-surface-primary rounded-xl border border-accent-teal/10 p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPreviousSaturday}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 px-3">
                <Calendar className="h-4 w-4 text-accent-teal" />
                <span className="text-sm font-medium min-w-[120px] text-center">
                  {selectedDate ? format(parseISO(selectedDate), "EEE, MMM d") : "All Dates"}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={goToNextSaturday} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
              {!selectedDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToThisSaturday}
                  className="text-xs text-accent-teal hover:text-accent-teal"
                >
                  This Sat
                </Button>
              )}
              {selectedDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearDateFilter}
                  className="text-xs text-accent-teal hover:text-accent-teal"
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-text-muted">
                <Filter className="h-4 w-4" />
                <span className="text-sm hidden sm:inline">Status:</span>
              </div>
              {STATUS_FILTERS.map((f) => {
                const count =
                  f.value === "all"
                    ? routes.length
                    : routes.filter((r) => r.status === f.value).length;
                const isActive = statusFilter === f.value;

                return (
                  <Badge
                    key={f.value}
                    variant={isActive ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all",
                      isActive
                        ? "bg-accent-teal hover:bg-accent-teal/90 text-text-inverse border-transparent"
                        : "bg-surface-primary border-accent-teal/20 text-text-primary hover:bg-accent-teal/10 hover:border-accent-teal/30"
                    )}
                    onClick={() => setStatusFilter(f.value)}
                  >
                    {f.label}
                    {count > 0 && <span className="ml-1.5 text-xs opacity-80">({count})</span>}
                  </Badge>
                );
              })}
            </div>
          </m.div>
        )}

        {/* Delivery Progress Summary */}
        {!error && stats.totalStops > 0 && (
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-gradient-to-r from-accent-teal/5 to-accent-teal/10 rounded-xl border border-accent-teal/10 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-accent-teal" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Delivery Progress</p>
                  <p className="text-xs text-text-muted">
                    {stats.deliveredStops} of {stats.totalStops} stops completed
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-display text-text-primary">
                  {Math.round((stats.deliveredStops / stats.totalStops) * 100)}%
                </p>
              </div>
            </div>
          </m.div>
        )}

        {/* Routes Table */}
        {!error && (
          <m.div
            initial={{ opacity: 0, y: 10 }}
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
