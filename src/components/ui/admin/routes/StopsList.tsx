"use client";

import type { MutableRefObject } from "react";
import { m } from "framer-motion";
import { Package } from "lucide-react";
import { RouteStopCard } from "./RouteStopCard";
import type { RouteStopStatus, StopDetail, RouteStatus } from "@/types/driver";

interface AvailableRoute {
  id: string;
  driverName: string | null;
  stopCount: number;
}

interface StopsListProps {
  stops: StopDetail[];
  routeStatus: RouteStatus;
  onStatusChange: (stopId: string, status: RouteStopStatus) => void;
  onRemoveStop: (stopId: string) => void;
  stopRefs?: MutableRefObject<Record<string, HTMLDivElement | null>>;
  availableRoutes?: AvailableRoute[];
  onReassign?: (stopId: string, targetRouteId: string) => void;
}

export function StopsList({
  stops,
  routeStatus,
  onStatusChange,
  onRemoveStop,
  stopRefs,
  availableRoutes,
  onReassign,
}: StopsListProps) {
  // Sort stops by stop_index
  const sortedStops = [...stops].sort((a, b) => a.stopIndex - b.stopIndex);

  // Empty state
  if (sortedStops.length === 0) {
    return (
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16 bg-gradient-to-br from-surface-secondary to-surface-tertiary rounded-xl border border-border-v5"
      >
        <div className="rounded-full bg-interactive-primary-light w-20 h-20 mx-auto flex items-center justify-center mb-4">
          <Package className="h-10 w-10 text-interactive-primary" />
        </div>
        <h2 className="text-xl font-display text-text-primary mb-2">No stops in this route</h2>
        <p className="text-text-secondary max-w-md mx-auto">
          Add orders to this route to create delivery stops.
        </p>
      </m.div>
    );
  }

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display text-text-primary">Stops ({sortedStops.length})</h2>
      </div>

      <div className="space-y-4">
        {sortedStops.map((stop, index) => (
          <div
            key={stop.id}
            ref={(el) => {
              if (stopRefs) {
                stopRefs.current[stop.id] = el;
              }
            }}
          >
            <RouteStopCard
              stop={stop}
              index={index}
              routeStatus={routeStatus}
              onStatusChange={onStatusChange}
              onRemoveStop={onRemoveStop}
              availableRoutes={availableRoutes}
              onReassign={onReassign}
            />
          </div>
        ))}
      </div>
    </m.div>
  );
}
