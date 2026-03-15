"use client";

import type { ReactNode } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import type { RouteStopStatus, StopDetail, RouteStatus } from "@/types/driver";
import { StopCardContent } from "./StopCardContent";
import { StopCardActions } from "./StopCardActions";

interface AvailableRoute {
  id: string;
  driverName: string | null;
  stopCount: number;
}

export interface RouteStopCardProps {
  stop: StopDetail;
  index: number;
  routeStatus: RouteStatus;
  onStatusChange: (stopId: string, status: RouteStopStatus) => void;
  onRemoveStop: (stopId: string) => void;
  availableRoutes?: AvailableRoute[];
  onReassign?: (stopId: string, targetRouteId: string) => void;
  dragHandle?: ReactNode;
  moveButtons?: ReactNode;
}

export function RouteStopCard({
  stop,
  index,
  routeStatus,
  onStatusChange,
  onRemoveStop,
  availableRoutes,
  onReassign,
  dragHandle,
  moveButtons,
}: RouteStopCardProps) {
  const hasException = stop.exception && !stop.exception.resolved;

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "bg-surface-primary rounded-xl border border-border p-4 shadow-sm border-l-4",
        hasException && "border-status-error/30",
        stop.status === "delivered" && "border-l-status-success",
        stop.status === "enroute" && "border-l-status-in-transit",
        stop.status === "arrived" && "border-l-status-in-transit",
        stop.status === "pending" && "border-l-border",
        stop.status === "skipped" && "border-l-secondary",
      )}
    >
      <div className="flex items-start gap-2">
        {dragHandle && <div className="flex-shrink-0 mt-1">{dragHandle}</div>}
        <div className="flex-1 min-w-0">
          <StopCardContent stop={stop} index={index} />
          <StopCardActions
            stop={stop}
            routeStatus={routeStatus}
            onStatusChange={onStatusChange}
            onRemoveStop={onRemoveStop}
            availableRoutes={availableRoutes}
            onReassign={onReassign}
          />
        </div>
        {moveButtons && <div className="flex-shrink-0">{moveButtons}</div>}
      </div>
    </m.div>
  );
}
