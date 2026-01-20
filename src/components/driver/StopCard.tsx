/**
 * V6 Stop Card Component - Pepper Aesthetic
 *
 * Individual stop card with status badge, address, and time window.
 * V6 colors, typography, and 56px touch targets.
 */

"use client";

import { MapPin, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { RouteStopStatus } from "@/types/driver";

interface StopCardProps {
  stopIndex: number;
  status: RouteStopStatus;
  customerName: string | null;
  address: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
  };
  timeWindow: {
    start: string | null;
    end: string | null;
  };
  isCurrentStop?: boolean;
  onClick?: () => void;
}

const statusConfig: Record<RouteStopStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-v6-surface-tertiary text-v6-text-secondary",
  },
  enroute: {
    label: "En Route",
    className: "bg-v6-secondary/20 text-v6-secondary-hover",
  },
  arrived: {
    label: "Arrived",
    className: "bg-v6-green/10 text-v6-green",
  },
  delivered: {
    label: "Delivered",
    className: "bg-v6-green text-white",
  },
  skipped: {
    label: "Skipped",
    className: "bg-v6-status-error/10 text-v6-status-error",
  },
};

export function StopCard({
  stopIndex,
  status,
  customerName,
  address,
  timeWindow,
  isCurrentStop = false,
  onClick,
}: StopCardProps) {
  const config = statusConfig[status];

  // Format time window
  const formatTime = (isoString: string | null): string => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const timeDisplay =
    timeWindow.start && timeWindow.end
      ? `${formatTime(timeWindow.start)} - ${formatTime(timeWindow.end)}`
      : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-v6-card-sm bg-v6-surface-primary p-4 text-left shadow-v6-sm border border-v6-border",
        "transition-all duration-v6-fast",
        "hover:shadow-v6-md active:scale-[0.98]",
        isCurrentStop && "ring-2 ring-v6-primary ring-offset-2"
      )}
      data-testid="stop-card"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left side */}
        <div className="flex-1 min-w-0">
          {/* Stop number and name */}
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-v6-text-primary font-v6-body text-xs font-bold text-white">
              {stopIndex}
            </span>
            <span className="font-v6-body font-medium text-v6-text-primary truncate">
              {customerName || "Customer"}
            </span>
          </div>

          {/* Address */}
          <div className="flex items-start gap-1.5 font-v6-body text-sm text-v6-text-secondary">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="line-clamp-2">
              {address.line1}
              {address.line2 && `, ${address.line2}`}
              {`, ${address.city}`}
            </span>
          </div>

          {/* Time window */}
          {timeDisplay && (
            <div className="flex items-center gap-1.5 mt-1.5 font-v6-body text-sm text-v6-text-muted">
              <Clock className="h-3.5 w-3.5" />
              <span>{timeDisplay}</span>
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex flex-col items-end gap-2">
          {/* Status badge */}
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 font-v6-body text-xs font-medium",
              config.className
            )}
          >
            {config.label}
          </span>

          {/* Chevron */}
          <ChevronRight className="h-5 w-5 text-v6-text-muted" />
        </div>
      </div>
    </button>
  );
}
