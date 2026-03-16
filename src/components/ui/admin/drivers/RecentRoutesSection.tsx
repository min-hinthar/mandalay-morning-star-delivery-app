/**
 * Recent Routes Section Component
 *
 * Displays driver's recent route history with status badges and navigation.
 * Fetches data from /api/admin/drivers/[id]/routes.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { Route, Calendar, Clock, ChevronRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/hooks/useToastV8";
import { spring } from "@/lib/motion-tokens";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RouteStatus } from "@/types/driver";

interface DriverRoute {
  id: string;
  deliveryDate: string;
  status: RouteStatus;
  totalStops: number;
  completedStops: number;
  startedAt: string | null;
  completedAt: string | null;
}

interface RecentRoutesSectionProps {
  driverId: string;
}

const STATUS_STYLES: Record<RouteStatus, { bg: string; text: string; label: string }> = {
  assigned: {
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    label: "Assigned",
  },
  accepted: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-600 dark:text-indigo-400",
    label: "Accepted",
  },
  planned: {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    label: "Planned",
  },
  in_progress: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    label: "In Progress",
  },
  completed: {
    bg: "bg-green/10",
    text: "text-green",
    label: "Completed",
  },
};

export function RecentRoutesSection({ driverId }: RecentRoutesSectionProps) {
  const router = useRouter();
  const [routes, setRoutes] = useState<DriverRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRoutes = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);

      try {
        const response = await fetch(`/api/admin/drivers/${driverId}/routes?limit=7`);
        if (!response.ok) throw new Error("Failed to fetch routes");

        const data = await response.json();
        setRoutes(data.routes || []);
      } catch {
        toast({
          message: "Failed to fetch route history",
          type: "error",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [driverId]
  );

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const calculateDuration = (route: DriverRoute) => {
    if (!route.startedAt || !route.completedAt) return null;
    const start = new Date(route.startedAt);
    const end = new Date(route.completedAt);
    const minutes = Math.round((end.getTime() - start.getTime()) / 60000);

    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  };

  if (loading) {
    return (
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-secondary rounded-card-sm border border-border p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-text-primary flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            Recent Routes
          </h2>
        </div>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-surface-tertiary rounded-input" />
          ))}
        </div>
      </m.div>
    );
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-secondary rounded-card-sm border border-border p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-text-primary flex items-center gap-2">
          <Route className="h-5 w-5 text-primary" />
          Recent Routes
          <span className="text-sm font-body font-normal text-text-muted">(Last 7 days)</span>
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchRoutes(true)}
          disabled={refreshing}
          className="text-text-muted hover:text-text-primary"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
        </Button>
      </div>

      {routes.length === 0 ? (
        <div className="text-center py-8">
          <div className="rounded-full bg-surface-tertiary w-12 h-12 mx-auto flex items-center justify-center mb-3">
            <Route className="h-6 w-6 text-text-muted" />
          </div>
          <p className="text-sm font-body text-text-secondary">No routes in the last 7 days</p>
        </div>
      ) : (
        <div className="space-y-2">
          {routes.map((route, index) => {
            const statusStyle = STATUS_STYLES[route.status];
            const duration = calculateDuration(route);

            return (
              <m.div
                key={route.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, ...spring.default }}
                onClick={() => router.push(`/admin/routes/${route.id}`)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-input",
                  "bg-surface-primary border border-border/50",
                  "hover:border-primary/30 hover:bg-primary-light/30",
                  "cursor-pointer transition-colors duration-fast group"
                )}
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Date */}
                  <div className="flex items-center gap-2 min-w-[110px]">
                    <Calendar className="h-4 w-4 text-text-muted shrink-0" />
                    <span className="text-sm font-body text-text-primary">
                      {formatDate(route.deliveryDate)}
                    </span>
                  </div>

                  {/* Status */}
                  <Badge className={cn("shrink-0", statusStyle.bg, statusStyle.text, "border-0")}>
                    {statusStyle.label}
                  </Badge>

                  {/* Stops info */}
                  <div className="hidden sm:flex items-center gap-1 text-sm font-body text-text-secondary">
                    <span className="font-medium text-text-primary">{route.completedStops}</span>
                    <span>/</span>
                    <span>{route.totalStops}</span>
                    <span className="text-text-muted">stops</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Duration */}
                  {duration && (
                    <div className="hidden sm:flex items-center gap-1 text-sm font-body text-text-muted">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{duration}</span>
                    </div>
                  )}

                  {/* Arrow */}
                  <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-primary transition-colors" />
                </div>
              </m.div>
            );
          })}
        </div>
      )}

      {routes.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full text-primary hover:bg-primary-light"
            onClick={() => router.push(`/admin/routes?driver=${driverId}`)}
          >
            View All Routes
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </m.div>
  );
}
