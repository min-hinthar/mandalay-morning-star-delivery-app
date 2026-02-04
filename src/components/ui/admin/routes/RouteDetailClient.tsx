"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  RefreshCw,
  Play,
  CheckCircle2,
  Clock,
  User,
  Phone,
  MessageSquare,
  Route,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RouteStatsBar } from "./RouteStatsBar";
import { StopsList } from "./StopsList";
import { RouteMap } from "./RouteMap";
import { OptimizationModal, type StopSummary } from "./OptimizationModal";
import { toast } from "@/lib/hooks/useToast";
import type { RouteStatus, RouteStopStatus, DriverListItem, StopDetail, RouteStats } from "@/types/driver";

// API Response types
interface RouteDetailResponse {
  id: string;
  deliveryDate: string;
  status: RouteStatus;
  optimizedPolyline: string | null;
  stats: RouteStats | null;
  startedAt: string | null;
  completedAt: string | null;
  driver: DriverListItem | null;
  stops: StopDetail[];
}

interface DriverOption {
  id: string;
  userId: string;
  fullName: string | null;
  isActive: boolean;
}

const STATUS_CONFIG: Record<RouteStatus, { label: string; className: string; icon: React.ReactNode }> = {
  planned: {
    label: "Planned",
    className: "bg-status-info-bg text-status-info border-status-info/30",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  in_progress: {
    label: "In Progress",
    className: "bg-interactive-primary-light text-interactive-primary border-interactive-primary/30",
    icon: <Play className="h-3.5 w-3.5" />,
  },
  completed: {
    label: "Completed",
    className: "bg-status-success-bg text-status-success border-status-success/30",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
};

export function RouteDetailClient() {
  const params = useParams();
  const router = useRouter();
  const routeId = params.id as string;

  const [route, setRoute] = useState<RouteDetailResponse | null>(null);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimizationModalOpen, setOptimizationModalOpen] = useState(false);
  const [isManuallyReordered, setIsManuallyReordered] = useState(false);

  // Refs for scroll-to-stop functionality
  const stopRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Handle map marker click - scroll to stop card
  const handleStopClick = useCallback((stopId: string) => {
    stopRefs.current[stopId]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, []);

  // Fetch route details
  const fetchRoute = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/routes/${routeId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch route");
      }
      const data = await response.json();
      setRoute(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load route");
    }
  }, [routeId]);

  // Fetch available drivers
  const fetchDrivers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/drivers");
      if (!response.ok) return;
      const data = await response.json();
      setDrivers(data.filter((d: DriverOption) => d.isActive));
    } catch {
      // Non-critical - continue without driver list
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchRoute(), fetchDrivers()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchRoute, fetchDrivers]);

  // Handle route status change
  const handleStatusChange = async (newStatus: RouteStatus) => {
    if (!route || isUpdating) return;

    setIsUpdating(true);
    const previousStatus = route.status;

    // Optimistic update
    setRoute({ ...route, status: newStatus });

    try {
      const response = await fetch(`/api/admin/routes/${routeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Refetch to get updated timestamps
      await fetchRoute();
    } catch {
      // Rollback on error
      setRoute({ ...route, status: previousStatus });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle driver assignment
  const handleDriverChange = async (driverId: string) => {
    if (!route || isUpdating) return;

    setIsUpdating(true);
    const previousDriver = route.driver;

    try {
      const response = await fetch(`/api/admin/routes/${routeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: driverId || null }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign driver");
      }

      // Refetch to get updated driver info
      await fetchRoute();
    } catch {
      // Rollback on error
      setRoute({ ...route, driver: previousDriver });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle stop status change
  const handleStopStatusChange = async (stopId: string, newStatus: RouteStopStatus) => {
    if (!route || isUpdating) return;

    setIsUpdating(true);
    const previousStops = [...route.stops];

    // Optimistic update
    setRoute({
      ...route,
      stops: route.stops.map((s) =>
        s.id === stopId ? { ...s, status: newStatus } : s
      ),
    });

    try {
      const response = await fetch(`/api/admin/routes/${routeId}/stops/${stopId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update stop status");
      }

      // Refetch to get updated stats
      await fetchRoute();
    } catch {
      // Rollback on error
      setRoute({ ...route, stops: previousStops });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle remove stop
  const handleRemoveStop = async (stopId: string) => {
    if (!route || isUpdating) return;
    if (!confirm("Are you sure you want to remove this stop from the route?")) return;

    setIsUpdating(true);
    const previousStops = [...route.stops];

    // Optimistic update
    setRoute({
      ...route,
      stops: route.stops.filter((s) => s.id !== stopId),
    });

    try {
      const response = await fetch(`/api/admin/routes/${routeId}/stops/${stopId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove stop");
      }

      // Refetch to get updated stats
      await fetchRoute();
    } catch (err) {
      // Rollback on error
      setRoute({ ...route, stops: previousStops });
      alert(err instanceof Error ? err.message : "Failed to remove stop");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle optimization modal apply
  const handleOptimizationApply = async (
    _optimizedStops: StopSummary[],
    savings: { durationSeconds: number; distanceMeters: number }
  ) => {
    if (!route) return;

    // Close modal
    setOptimizationModalOpen(false);

    // The optimization API already updates the database
    // Just refetch to get the new order
    await fetchRoute();

    // Clear manual reorder flag
    setIsManuallyReordered(false);

    // Show success toast with savings
    const minutes = Math.round(savings.durationSeconds / 60);
    const miles = (savings.distanceMeters / 1609.34).toFixed(1);
    toast({
      title: "Route optimized",
      description: `Saved ${minutes} min / ${miles} mi`,
      variant: "success",
    });
  };

  // Convert stops to StopSummary format for modal
  const getStopSummaries = (): StopSummary[] => {
    if (!route) return [];
    return [...route.stops]
      .sort((a, b) => a.stopIndex - b.stopIndex)
      .map((stop, index) => ({
        id: stop.id,
        stopNumber: index + 1,
        customerName: stop.order?.customer?.fullName || "Unknown Customer",
        address: stop.order?.address
          ? `${stop.order.address.line1}, ${stop.order.address.city}`
          : "Unknown Address",
      }));
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <Skeleton width={120} height={36} radius="lg" />
          <Skeleton width={200} height={40} radius="md" />
        </div>
        <Skeleton width="100%" height={80} radius="lg" />
        <Skeleton width="100%" height={256} radius="lg" />
        <div className="space-y-4">
          <Skeleton width="100%" height={160} radius="lg" />
          <Skeleton width="100%" height={160} radius="lg" />
          <Skeleton width="100%" height={160} radius="lg" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !route) {
    return (
      <div className="p-4 md:p-8">
        <div className="text-center py-16 bg-gradient-to-br from-surface-secondary to-surface-tertiary rounded-xl border border-border-v5">
          <div className="rounded-full bg-status-error-bg w-20 h-20 mx-auto flex items-center justify-center mb-4">
            <Route className="h-10 w-10 text-status-error" />
          </div>
          <h2 className="text-xl font-display text-text-primary mb-2">
            {error || "Route not found"}
          </h2>
          <Button variant="outline" onClick={() => router.push("/admin/routes")}>
            Back to Routes
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[route.status];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push("/admin/routes")}
            aria-label="Back to routes"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display text-text-primary">
                Route Details
              </h1>
              <Badge className={cn(statusConfig.className, "gap-1.5 border")}>
                {statusConfig.icon}
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-sm text-text-secondary mt-1">
              {format(parseISO(route.deliveryDate), "EEEE, MMMM d, yyyy")} • #{routeId.slice(0, 8)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status dropdown */}
          <Select
            value={route.status}
            onValueChange={(value) => handleStatusChange(value as RouteStatus)}
            disabled={isUpdating}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Change status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          {/* Optimize button (only for planned routes) */}
          {route.status === "planned" && route.stops.length > 1 && (
            <Button
              variant="outline"
              onClick={() => setOptimizationModalOpen(true)}
              leftIcon={<Zap className="h-4 w-4" />}
            >
              Optimize
            </Button>
          )}

          {/* Manual reorder warning badge */}
          {isManuallyReordered && route.status === "planned" && (
            <Badge
              variant="outline"
              className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/30 gap-1.5"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Not optimized
            </Badge>
          )}

          {/* Refresh button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchRoute}
            aria-label="Refresh route"
          >
            <RefreshCw className={cn("h-5 w-5", isUpdating && "animate-spin")} />
          </Button>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <RouteStatsBar route={route} />

      {/* Driver Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-surface-secondary rounded-card-sm border border-border p-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-interactive-primary-light to-accent-tertiary/10 flex items-center justify-center">
              {route.driver ? (
                route.driver.profileImageUrl ? (
                  <Image
                    src={route.driver.profileImageUrl}
                    alt={route.driver.fullName || "Driver"}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-semibold text-interactive-primary">
                    {route.driver.fullName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "DR"}
                  </span>
                )
              ) : (
                <User className="h-6 w-6 text-text-muted" />
              )}
            </div>
            <div>
              <p className="font-medium text-text-primary">
                {route.driver?.fullName || "Unassigned"}
              </p>
              {route.driver && (
                <div className="flex items-center gap-3 mt-1">
                  {route.driver.phone && (
                    <>
                      <a
                        href={`tel:${route.driver.phone}`}
                        className="flex items-center gap-1 text-sm text-interactive-primary hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Call
                      </a>
                      <a
                        href={`sms:${route.driver.phone}`}
                        className="flex items-center gap-1 text-sm text-interactive-primary hover:underline"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        SMS
                      </a>
                    </>
                  )}
                  <span className="text-sm text-text-secondary">
                    {route.driver.deliveriesCount} deliveries
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Driver assignment dropdown */}
          <Select
            value={route.driver?.id || "unassigned"}
            onValueChange={(value) => handleDriverChange(value === "unassigned" ? "" : value)}
            disabled={isUpdating}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Assign driver" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  {driver.fullName || driver.userId.slice(0, 8)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Route Map */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="h-[400px] rounded-card-sm overflow-hidden"
      >
        <RouteMap
          stops={route.stops
            .map((stop) => ({
              id: stop.id,
              stopIndex: stop.stopIndex,
              status: stop.status,
              lat: stop.order?.address?.lat || 0,
              lng: stop.order?.address?.lng || 0,
              hasException: Boolean(stop.exception && !stop.exception.resolved),
            }))
            .filter((s) => s.lat && s.lng)}
          polyline={route.optimizedPolyline}
          onStopClick={handleStopClick}
        />
      </motion.div>

      {/* Stops List */}
      <StopsList
        stops={route.stops}
        routeStatus={route.status}
        onStatusChange={handleStopStatusChange}
        onRemoveStop={handleRemoveStop}
        stopRefs={stopRefs}
      />

      {/* Optimization Modal */}
      <OptimizationModal
        open={optimizationModalOpen}
        onOpenChange={setOptimizationModalOpen}
        routeId={routeId}
        currentStops={getStopSummaries()}
        onApply={handleOptimizationApply}
      />
    </div>
  );
}
