"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { m } from "framer-motion";
import { Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonCrossfade } from "@/components/ui/admin/SkeletonCrossfade";
import { AdminPageHeader } from "@/components/ui/admin/AdminPageHeader";
import { RouteStatsBar } from "../RouteStatsBar";
import { StopsList } from "../StopsList";
import { LazyRouteMap } from "@/components/ui/maps/LazyMaps";
import { useViewportTrigger } from "@/lib/hooks/useViewportTrigger";
import { MapSkeleton } from "@/components/ui/maps/MapSkeleton";
import { OptimizationModal, type StopSummary } from "../OptimizationModal";
import { AddStopsModal } from "../AddStopsModal";
import { toast } from "@/lib/hooks/useToastV8";
import { RouteHeader } from "./RouteHeader";
import { DriverInfoCard } from "./DriverInfoCard";
import { RouteTimeline } from "./RouteTimeline";
import { TimeComparison } from "./TimeComparison";
import { ExceptionAlert } from "./ExceptionAlert";
import type { RouteDetailResponse, DriverOption, RouteStatus, RouteStopStatus } from "./types";

interface AvailableRoute {
  id: string;
  driverName: string | null;
  stopCount: number;
}

export function RouteDetailClient() {
  const params = useParams();
  const router = useRouter();
  const routeId = params.id as string;

  const [route, setRoute] = useState<RouteDetailResponse | null>(null);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [availableRoutes, setAvailableRoutes] = useState<AvailableRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimizationModalOpen, setOptimizationModalOpen] = useState(false);
  const [addStopsModalOpen, setAddStopsModalOpen] = useState(false);
  const [isManuallyReordered, setIsManuallyReordered] = useState(false);

  const stopRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { ref: mapRef, triggered: mapTriggered } = useViewportTrigger();

  const handleStopClick = useCallback((stopId: string) => {
    stopRefs.current[stopId]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, []);

  const fetchRoute = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/routes/${routeId}`);
      if (!response.ok) throw new Error("Failed to fetch route");
      const data = await response.json();
      setRoute(data);
      setError(null);

      // After loading route, fetch other planned routes for the same delivery date
      if (data.deliveryDate) {
        try {
          const routesResponse = await fetch(`/api/admin/routes?date=${data.deliveryDate}`);
          if (routesResponse.ok) {
            const allRoutesJson = await routesResponse.json();
            const allRoutes = allRoutesJson.data ?? allRoutesJson;
            const others = allRoutes
              .filter(
                (r: {
                  id: string;
                  status: string;
                  stopCount: number;
                  driver: { fullName: string | null } | null;
                }) => r.id !== routeId && r.status === "planned"
              )
              .map(
                (r: {
                  id: string;
                  stopCount: number;
                  driver: { fullName: string | null } | null;
                }) => ({
                  id: r.id,
                  driverName: r.driver?.fullName ?? null,
                  stopCount: r.stopCount,
                })
              );
            setAvailableRoutes(others);
          }
        } catch {
          // Non-critical — reassign dropdown simply won't show
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load route");
    }
  }, [routeId]);

  const fetchDrivers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/drivers");
      if (!response.ok) return;
      const json = await response.json();
      const data = json.data ?? json;
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

  const handleStatusChange = async (newStatus: RouteStatus) => {
    if (!route || isUpdating) return;
    setIsUpdating(true);
    const previousStatus = route.status;
    setRoute({ ...route, status: newStatus });

    try {
      const response = await fetch(`/api/admin/routes/${routeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      await fetchRoute();
    } catch {
      setRoute({ ...route, status: previousStatus });
    } finally {
      setIsUpdating(false);
    }
  };

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
      if (!response.ok) throw new Error("Failed to assign driver");
      await fetchRoute();
    } catch {
      setRoute({ ...route, driver: previousDriver });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStopStatusChange = async (stopId: string, newStatus: RouteStopStatus) => {
    if (!route || isUpdating) return;
    setIsUpdating(true);
    const previousStops = [...route.stops];
    setRoute({
      ...route,
      stops: route.stops.map((s) => (s.id === stopId ? { ...s, status: newStatus } : s)),
    });

    try {
      const response = await fetch(`/api/admin/routes/${routeId}/stops/${stopId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update stop status");
      await fetchRoute();
    } catch {
      setRoute({ ...route, stops: previousStops });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveStop = async (stopId: string) => {
    if (!route || isUpdating) return;
    setIsUpdating(true);
    const previousStops = [...route.stops];
    setRoute({ ...route, stops: route.stops.filter((s) => s.id !== stopId) });

    try {
      const response = await fetch(`/api/admin/routes/${routeId}/stops/${stopId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove stop");
      }
      await fetchRoute();
    } catch (err) {
      setRoute({ ...route, stops: previousStops });
      toast({
        message: err instanceof Error ? err.message : "Failed to remove stop",
        type: "error",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReassign = async (stopId: string, targetRouteId: string) => {
    if (!route || isUpdating) return;
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/admin/routes/${routeId}/stops/reassign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stopId, targetRouteId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reassign stop");
      }

      toast({ message: "Order reassigned", type: "success" });
      await fetchRoute();
    } catch (err) {
      toast({
        message: err instanceof Error ? err.message : "Failed to reassign stop",
        type: "error",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOptimizationApply = async () => {
    if (!route) return;
    setOptimizationModalOpen(false);
    await fetchRoute();
    setIsManuallyReordered(false);
    toast({ message: "Route optimized", type: "success" });
  };

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

  const routeName = route ? `Route #${routeId.slice(0, 8)}` : "Route Details";

  const routeDetailSkeleton = (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      <Skeleton width={300} height={24} radius="md" />
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

  if (!isLoading && (error || !route)) {
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

  return (
    <SkeletonCrossfade isLoading={isLoading} skeleton={routeDetailSkeleton}>
      <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
        <AdminPageHeader
          title={routeName}
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "Routes", href: "/admin/routes" },
            { label: routeName },
          ]}
        />

        {route && (
          <>
            <RouteHeader
              route={route}
              routeId={routeId}
              isUpdating={isUpdating}
              isManuallyReordered={isManuallyReordered}
              onStatusChange={handleStatusChange}
              onOptimize={() => setOptimizationModalOpen(true)}
              onAddStops={() => setAddStopsModalOpen(true)}
              onRefresh={fetchRoute}
              onBack={() => router.push("/admin/routes")}
              pendingStopCount={route.stops.filter((s) => s.status === "pending").length}
              hasSameDatePlannedRoutes={false}
              onSplit={() => {}}
              onMerge={() => {}}
              onDelete={() => {}}
            />

            {/* Exception alert at top */}
            <ExceptionAlert stops={route.stops} />

            <RouteStatsBar route={route} />

            {/* Time comparison (only shows for completed routes) */}
            <TimeComparison route={route} />

            <DriverInfoCard
              route={route}
              drivers={drivers}
              isUpdating={isUpdating}
              onDriverChange={handleDriverChange}
            />

            {/* Route Map */}
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="h-[400px] rounded-xl shadow-lg overflow-hidden"
              ref={mapRef}
            >
              {mapTriggered ? (
                <LazyRouteMap
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
              ) : (
                <MapSkeleton height={400} />
              )}
            </m.div>

            {/* Route Timeline */}
            <RouteTimeline stops={route.stops} />

            {/* Traditional stops list */}
            <StopsList
              stops={route.stops}
              routeStatus={route.status}
              onStatusChange={handleStopStatusChange}
              onRemoveStop={handleRemoveStop}
              stopRefs={stopRefs}
              availableRoutes={availableRoutes}
              onReassign={handleReassign}
            />

            <OptimizationModal
              open={optimizationModalOpen}
              onOpenChange={setOptimizationModalOpen}
              routeId={routeId}
              currentStops={getStopSummaries()}
              onApply={handleOptimizationApply}
            />

            <AddStopsModal
              open={addStopsModalOpen}
              onOpenChange={setAddStopsModalOpen}
              routeId={routeId}
              onStopsAdded={() => {
                toast({ message: "Stops added to route", type: "success" });
                fetchRoute();
              }}
            />
          </>
        )}
      </div>
    </SkeletonCrossfade>
  );
}
