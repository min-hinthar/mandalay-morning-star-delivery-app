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
    className: "bg-surface-tertiary text-text-secondary",
  },
  enroute: {
    label: "En Route",
    className: "bg-status-warning-bg text-status-warning",
  },
  arrived: {
    label: "Arrived",
    className: "bg-status-success-bg text-status-success",
  },
  delivered: {
    label: "Delivered",
    className: "bg-status-success text-text-inverse",
  },
  skipped: {
    label: "Skipped",
    className: "bg-status-error-bg text-status-error",
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
        "w-full rounded-xl bg-surface-primary p-4 text-left shadow-sm transition-all",
        "hover:shadow-md active:scale-[0.98]",
        isCurrentStop && "ring-2 ring-status-success ring-offset-2"
      )}
      data-testid="stop-card"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left side */}
        <div className="flex-1 min-w-0">
          {/* Stop number and name */}
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-text-primary text-xs font-bold text-text-inverse">
              {stopIndex}
            </span>
            <span className="font-medium text-text-primary truncate">
              {customerName || "Customer"}
            </span>
          </div>

          {/* Address */}
          <div className="flex items-start gap-1.5 text-sm text-text-secondary">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="line-clamp-2">
              {address.line1}
              {address.line2 && `, ${address.line2}`}
              {`, ${address.city}`}
            </span>
          </div>

          {/* Time window */}
          {timeDisplay && (
            <div className="flex items-center gap-1.5 mt-1.5 text-sm text-text-secondary/80">
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
              "rounded-full px-2 py-0.5 text-xs font-medium",
              config.className
            )}
          >
            {config.label}
          </span>

          {/* Chevron */}
          <ChevronRight className="h-5 w-5 text-text-secondary/50" />
        </div>
      </div>
    </button>
  );
}
