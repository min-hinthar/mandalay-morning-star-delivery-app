"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { format, subDays, addDays, startOfDay, parseISO } from "date-fns";
import {
  RefreshCw,
  Plus,
  Filter,
  Route,
  MapPin,
  TrendingUp,
  CheckCircle2,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import {
  RouteListTable,
  type AdminRoute,
} from "@/components/admin/routes/RouteListTable";
import {
  CreateRouteModal,
  type CreateRouteData,
} from "@/components/admin/routes/CreateRouteModal";
import type { RouteStatus } from "@/types/driver";

type StatusFilter = "all" | RouteStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Routes" },
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

interface RouteStats {
  total: number;
  planned: number;
  inProgress: number;
  completed: number;
  totalStops: number;
  deliveredStops: number;
}

export default function AdminRoutesPage() {
  const router = useRouter();
  const [routes, setRoutes] = useState<AdminRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchRoutes = useCallback(async () => {
    try {
      let url = "/api/admin/routes";
      if (selectedDate) {
        url += `?date=${selectedDate}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch routes");
      }
      const data: AdminRoute[] = await response.json();
      setRoutes(data);
    } catch (error) {
      console.error("Error fetching routes:", error);
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
        const error = await response.json();
        throw new Error(error.error || "Failed to update route");
      }

      // Refresh routes
      await fetchRoutes();
      router.refresh();
    } catch (error) {
      console.error("Error updating route status:", error);
      alert(error instanceof Error ? error.message : "Failed to update route");
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    try {
      const response = await fetch(`/api/admin/routes/${routeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete route");
      }

      // Remove from local state
      setRoutes((prev) => prev.filter((r) => r.id !== routeId));
      router.refresh();
    } catch (error) {
      console.error("Error deleting route:", error);
      alert(error instanceof Error ? error.message : "Failed to delete route");
    }
  };

  const handleCreateRoute = async (data: CreateRouteData) => {
    const response = await fetch("/api/admin/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create route");
    }

    // Refresh the list
    await fetchRoutes();
  };

  // Navigate dates
  const goToPreviousDay = () => {
    const current = selectedDate
      ? parseISO(selectedDate)
      : startOfDay(new Date());
    setSelectedDate(format(subDays(current, 1), "yyyy-MM-dd"));
  };

  const goToNextDay = () => {
    const current = selectedDate
      ? parseISO(selectedDate)
      : startOfDay(new Date());
    setSelectedDate(format(addDays(current, 1), "yyyy-MM-dd"));
  };

  const goToToday = () => {
    setSelectedDate(null);
  };

  // Filter routes by status
  const filteredRoutes =
    statusFilter === "all"
      ? routes
      : routes.filter((route) => route.status === statusFilter);

  // Calculate stats
  const stats: RouteStats = {
    total: routes.length,
    planned: routes.filter((r) => r.status === "planned").length,
    inProgress: routes.filter((r) => r.status === "in_progress").length,
    completed: routes.filter((r) => r.status === "completed").length,
    totalStops: routes.reduce((sum, r) => sum + r.stopCount, 0),
    deliveredStops: routes.reduce((sum, r) => sum + r.deliveredCount, 0),
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 bg-muted rounded" />
          <div className="h-4 w-64 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-xl" />
            ))}
          </div>
          <div className="h-96 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-display text-charcoal">
            Delivery Routes
          </h1>
          <p className="text-muted-foreground mt-1">
            Plan and manage delivery routes for your drivers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-curry/20 hover:bg-curry/5"
          >
            <RefreshCw
              className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")}
            />
            Refresh
          </Button>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-saffron to-curry hover:from-saffron-dark hover:to-curry-dark text-white shadow-md"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Route
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {/* Total Routes */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cream to-lotus/30 border border-curry/10 p-4 shadow-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-saffron/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-saffron">
              <Route className="h-5 w-5" />
              <span className="text-sm font-medium">Total Routes</span>
            </div>
            <p className="text-3xl font-display text-charcoal mt-2">
              {stats.total}
            </p>
          </div>
        </div>

        {/* Planned */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 p-4 shadow-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-blue-600">
              <Clock className="h-5 w-5" />
              <span className="text-sm font-medium">Planned</span>
            </div>
            <p className="text-3xl font-display text-charcoal mt-2">
              {stats.planned}
            </p>
          </div>
        </div>

        {/* In Progress */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-saffron/5 to-saffron/10 border border-saffron/20 p-4 shadow-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-saffron/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-saffron">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm font-medium">In Progress</span>
            </div>
            <p className="text-3xl font-display text-charcoal mt-2">
              {stats.inProgress}
            </p>
          </div>
        </div>

        {/* Completed */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-jade/5 to-jade/10 border border-jade/20 p-4 shadow-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-jade/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-jade">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Completed</span>
            </div>
            <p className="text-3xl font-display text-charcoal mt-2">
              {stats.completed}
              {stats.total > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({Math.round((stats.completed / stats.total) * 100)}%)
                </span>
              )}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Date Navigation & Status Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
      >
        {/* Date Navigation */}
        <div className="flex items-center gap-2 bg-white rounded-xl border border-curry/10 p-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousDay}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 px-3">
            <Calendar className="h-4 w-4 text-saffron" />
            <span className="text-sm font-medium min-w-[120px] text-center">
              {selectedDate
                ? format(parseISO(selectedDate), "EEE, MMM d")
                : "All Dates"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextDay}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {selectedDate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="text-xs text-saffron hover:text-saffron"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="text-sm hidden sm:inline">Status:</span>
          </div>
          {STATUS_FILTERS.map((filter) => {
            const count =
              filter.value === "all"
                ? routes.length
                : routes.filter((r) => r.status === filter.value).length;
            const isActive = statusFilter === filter.value;

            return (
              <Badge
                key={filter.value}
                variant={isActive ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-all",
                  isActive
                    ? "bg-saffron hover:bg-saffron/90 text-white border-transparent"
                    : "bg-white border-curry/20 text-charcoal hover:bg-saffron/10 hover:border-saffron/30"
                )}
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.label}
                {count > 0 && (
                  <span className="ml-1.5 text-xs opacity-80">({count})</span>
                )}
              </Badge>
            );
          })}
        </div>
      </motion.div>

      {/* Delivery Progress Summary */}
      {stats.totalStops > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-gradient-to-r from-cream to-lotus/20 rounded-xl border border-curry/10 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-curry" />
              <div>
                <p className="text-sm font-medium text-charcoal">
                  Delivery Progress
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.deliveredStops} of {stats.totalStops} stops completed
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-display text-charcoal">
                {Math.round((stats.deliveredStops / stats.totalStops) * 100)}%
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Routes Table */}
      <motion.div
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
      </motion.div>

      {/* Create Route Modal */}
      <CreateRouteModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={handleCreateRoute}
      />
    </div>
  );
}
