"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { m } from "framer-motion";
import { Scissors } from "lucide-react";
import { SkeletonCrossfade } from "@/components/ui/admin/SkeletonCrossfade";
import { RouteDetailSkeleton, RouteErrorState } from "./RouteDetailSkeleton";
import { AdminPageHeader } from "@/components/ui/admin/AdminPageHeader";
import { RouteStatsBar } from "../RouteStatsBar";
import { StopsList } from "../StopsList";
import { LazyRouteMap } from "@/components/ui/maps/LazyMaps";
import { useViewportTrigger } from "@/lib/hooks/useViewportTrigger";
import { MapSkeleton } from "@/components/ui/maps/MapSkeleton";
import { OptimizationModal, type StopSummary } from "../OptimizationModal";
import { AddStopsModal } from "../AddStopsModal";
import { toast } from "@/lib/hooks/useToastV8";
import { useReorderStops } from "@/lib/hooks/useReorderStops";
import { useReassignDriver } from "@/lib/hooks/useReassignDriver";
import { useRouteActions } from "@/lib/hooks/useRouteActions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/admin/settings/ConfirmDialog";
import { SplitRouteModal } from "./SplitRouteModal";
import { MergeRouteModal } from "./MergeRouteModal";
import { RouteHeader } from "./RouteHeader";
import { DriverInfoCard } from "./DriverInfoCard";
import { RouteTimeline } from "./RouteTimeline";
import { TimeComparison } from "./TimeComparison";
import { ExceptionAlert } from "./ExceptionAlert";
import { useStopMutations } from "./useStopMutations";
import { validateSplitSelection } from "../route-selection-utils";
import type { RouteDetailResponse, DriverOption } from "./types";
import type { StopDetail } from "@/types/driver";

interface AvailableRoute {
  id: string;
  driverName: string | null;
  stopCount: number;
  status: string;
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
  const [localStops, setLocalStops] = useState<StopDetail[]>([]);

  const stopRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { ref: mapRef, triggered: mapTriggered } = useViewportTrigger();

  const handleStopClick = useCallback((stopId: string) => {
    stopRefs.current[stopId]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const fetchRoute = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/routes/${routeId}`);
      if (!response.ok) throw new Error("Failed to fetch route");
      const data = await response.json();
      setRoute(data);
      setLocalStops(data.stops ?? []);
      setError(null);
      if (data.deliveryDate) {
        try {
          const res = await fetch(`/api/admin/routes?date=${data.deliveryDate}`);
          if (res.ok) {
            const json = await res.json();
            const all = json.data ?? json;
            type RouteRow = {
              id: string;
              status: string;
              stopCount: number;
              driver: { fullName: string | null } | null;
            };
            setAvailableRoutes(
              all
                .filter(
                  (r: RouteRow) =>
                    r.id !== routeId && ["planned", "assigned", "accepted"].includes(r.status)
                )
                .map((r: RouteRow) => ({
                  id: r.id,
                  driverName: r.driver?.fullName ?? null,
                  stopCount: r.stopCount,
                  status: r.status,
                }))
            );
          }
        } catch {
          /* non-critical */
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load route");
    }
  }, [routeId]);

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/drivers");
      if (!res.ok) return;
      const json = await res.json();
      setDrivers((json.data ?? json).filter((d: DriverOption) => d.isActive));
    } catch {
      /* non-critical */
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

  const routeActions = useRouteActions({
    routeId,
    onSplitSuccess: fetchRoute,
    onMergeSuccess: fetchRoute,
    onDeleteSuccess: () => router.push("/admin/routes"),
  });

  const { handleStatusChange, handleStopStatusChange, handleRemoveStop, handleReassign } =
    useStopMutations({ routeId, route, isUpdating, setIsUpdating, setRoute, fetchRoute });

  const reorderStops = useReorderStops({
    routeId,
    routeStatus: route?.status ?? "planned",
    onSuccess: () => {
      setIsManuallyReordered(true);
      fetchRoute();
    },
    onError: (previousStops) => {
      setLocalStops(previousStops);
    },
  });

  const reassignDriver = useReassignDriver({
    routeId,
    routeStatus: route?.status ?? "planned",
    currentDriverName: route?.driver?.fullName ?? null,
    onSuccess: fetchRoute,
  });

  const handleReorder = useCallback(
    (reorderedStops: StopDetail[]) => {
      const updated = reorderedStops.map((stop, i) => ({ ...stop, stopIndex: i }));
      setLocalStops(updated);
      reorderStops.handleReorder(updated);
    },
    [reorderStops]
  );

  const handleMoveStop = useCallback(
    (stopId: string, direction: "up" | "down") => {
      const sorted = [...localStops].sort((a, b) => a.stopIndex - b.stopIndex);
      const idx = sorted.findIndex((s) => s.id === stopId);
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (idx === -1 || target < 0 || target >= sorted.length) return;
      const swapped = [...sorted];
      [swapped[idx], swapped[target]] = [swapped[target], swapped[idx]];
      handleReorder(swapped);
    },
    [localStops, handleReorder]
  );

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

  const pendingStopCount = localStops.filter((s) => s.status === "pending").length;
  const hasSameDatePlannedRoutes = availableRoutes.length > 0;
  const splitValidation = validateSplitSelection(routeActions.selectedStopIds, localStops.length);
  const selectedStopsForModal = localStops.filter((s) => routeActions.selectedStopIds.has(s.id));
  const routeName = route ? `Route #${routeId.slice(0, 8)}` : "Route Details";

  if (!isLoading && (error || !route)) {
    return <RouteErrorState error={error} onBack={() => router.push("/admin/routes")} />;
  }

  return (
    <SkeletonCrossfade isLoading={isLoading} skeleton={<RouteDetailSkeleton />}>
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
              pendingStopCount={pendingStopCount}
              hasSameDatePlannedRoutes={hasSameDatePlannedRoutes}
              onSplit={routeActions.enterSelectionMode}
              onMerge={routeActions.openMerge}
              onDelete={routeActions.openDelete}
            />

            <ExceptionAlert stops={route.stops} />
            <RouteStatsBar route={route} />
            <TimeComparison route={route} />

            <DriverInfoCard
              route={route}
              drivers={drivers}
              isUpdating={isUpdating}
              onDriverChange={(id: string) => reassignDriver.reassignDriver(id)}
              showConfirmation={reassignDriver.showConfirmation}
              onConfirmReassign={reassignDriver.confirmReassign}
              onCancelReassign={reassignDriver.cancelReassign}
              isReassigning={reassignDriver.isReassigning}
              pendingDriverId={reassignDriver.pendingDriverId}
            />

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

            <RouteTimeline stops={route.stops} />

            <StopsList
              stops={localStops}
              routeStatus={route.status}
              onStatusChange={handleStopStatusChange}
              onRemoveStop={handleRemoveStop}
              stopRefs={stopRefs}
              availableRoutes={availableRoutes}
              onReassign={handleReassign}
              onReorder={handleReorder}
              onMoveStop={handleMoveStop}
              disabled={route.status === "completed"}
              selectionMode={routeActions.selectionMode}
              selectedStopIds={routeActions.selectedStopIds}
              onToggleSelect={routeActions.toggleStopSelect}
              onSelectionChange={routeActions.updateSelection}
            />

            {routeActions.selectionMode && (
              <div className="fixed bottom-0 left-0 right-0 bg-surface-primary border-t border-border p-4 shadow-lg z-40">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                  <span className="text-sm text-text-secondary">
                    {routeActions.selectedStopIds.size} stop
                    {routeActions.selectedStopIds.size !== 1 ? "s" : ""} selected
                  </span>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={routeActions.exitSelectionMode}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => routeActions.confirmSplit(localStops.length)}
                      disabled={!splitValidation.valid}
                      leftIcon={<Scissors className="h-4 w-4" />}
                    >
                      Split {routeActions.selectedStopIds.size} Stop
                      {routeActions.selectedStopIds.size !== 1 ? "s" : ""}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <SplitRouteModal
              open={routeActions.showSplitModal}
              onOpenChange={routeActions.setShowSplitModal}
              selectedStops={selectedStopsForModal}
              routeId={routeId}
              drivers={drivers}
              onSuccess={routeActions.onSplitComplete}
            />

            <MergeRouteModal
              open={routeActions.showMergeModal}
              onOpenChange={routeActions.setShowMergeModal}
              routeId={routeId}
              availableRoutes={availableRoutes}
              onSuccess={routeActions.onMergeComplete}
              onOptimize={() => setOptimizationModalOpen(true)}
            />

            <ConfirmDialog
              open={routeActions.showDeleteConfirm}
              title="Delete Route"
              description={`Delete route with ${localStops.length} stop${localStops.length !== 1 ? "s" : ""}? Stops will be unassigned.`}
              confirmLabel="Delete"
              onConfirm={routeActions.confirmDelete}
              onCancel={routeActions.cancelDelete}
              isLoading={routeActions.isDeleting}
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
