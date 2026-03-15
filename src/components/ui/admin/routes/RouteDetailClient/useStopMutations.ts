"use client";

import { useCallback } from "react";
import { toast } from "@/lib/hooks/useToastV8";
import type { RouteDetailResponse, RouteStatus, RouteStopStatus } from "./types";

interface UseStopMutationsOptions {
  routeId: string;
  route: RouteDetailResponse | null;
  isUpdating: boolean;
  setIsUpdating: (v: boolean) => void;
  setRoute: (r: RouteDetailResponse | null) => void;
  fetchRoute: () => Promise<void>;
}

export function useStopMutations({
  routeId,
  route,
  isUpdating,
  setIsUpdating,
  setRoute,
  fetchRoute,
}: UseStopMutationsOptions) {
  const handleStatusChange = useCallback(
    async (newStatus: RouteStatus) => {
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
    },
    [route, isUpdating, routeId, fetchRoute, setIsUpdating, setRoute]
  );

  const handleStopStatusChange = useCallback(
    async (stopId: string, newStatus: RouteStopStatus) => {
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
    },
    [route, isUpdating, routeId, fetchRoute, setIsUpdating, setRoute]
  );

  const handleRemoveStop = useCallback(
    async (stopId: string) => {
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
    },
    [route, isUpdating, routeId, fetchRoute, setIsUpdating, setRoute]
  );

  const handleReassign = useCallback(
    async (stopId: string, targetRouteId: string) => {
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
    },
    [route, isUpdating, routeId, fetchRoute, setIsUpdating]
  );

  return { handleStatusChange, handleStopStatusChange, handleRemoveStop, handleReassign };
}
