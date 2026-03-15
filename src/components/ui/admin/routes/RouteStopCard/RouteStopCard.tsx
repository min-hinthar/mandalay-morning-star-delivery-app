"use client";

import type { ReactNode } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Checkbox } from "@/components/ui/checkbox";
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
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (stopId: string) => void;
  selectionDisabled?: boolean;
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
  selectionMode,
  selected,
  onToggleSelect,
  selectionDisabled,
}: RouteStopCardProps) {
  const hasException = stop.exception && !stop.exception.resolved;

  // Selection mode: simplified card with checkbox
  if (selectionMode) {
    return (
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={cn(
          "bg-surface-primary rounded-xl border border-border p-4 shadow-sm border-l-4",
          selected && "ring-2 ring-interactive-primary border-interactive-primary",
          selectionDisabled && "opacity-50",
          stop.status === "pending" && "border-l-border",
          stop.status === "delivered" && "border-l-status-success",
          stop.status === "enroute" && "border-l-status-in-transit",
          stop.status === "arrived" && "border-l-status-in-transit",
          stop.status === "skipped" && "border-l-secondary"
        )}
      >
        <label className="flex items-center gap-3 cursor-pointer">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelect?.(stop.id)}
            disabled={selectionDisabled}
            aria-label={`Select stop ${index + 1}`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text-secondary">#{index + 1}</span>
              <span className="text-sm font-medium text-text-primary truncate">
                {stop.order?.customer?.fullName || "Unknown Customer"}
              </span>
            </div>
            <p className="text-xs text-text-secondary truncate mt-0.5">
              {stop.order?.address
                ? `${stop.order.address.line1}, ${stop.order.address.city}`
                : "Unknown Address"}
            </p>
          </div>
        </label>
      </m.div>
    );
  }

  // Normal mode
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
        stop.status === "skipped" && "border-l-secondary"
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
