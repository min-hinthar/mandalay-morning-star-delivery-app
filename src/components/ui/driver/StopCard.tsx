/**
 * V8 Stop Card Component - Driver Polish
 *
 * Individual stop card with status-based left border, hover/tap micro-interactions,
 * staggered entry animation, and status badge with pulse for active statuses.
 */

"use client";

import { m, type Variants } from "framer-motion";
import { MapPin, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { staggerItem } from "@/lib/motion-tokens/stagger";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
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
  eta?: string | null;
  isCurrentStop?: boolean;
  onClick?: () => void;
}

const statusConfig: Record<
  RouteStopStatus,
  { label: string; badgeClass: string; borderClass: string }
> = {
  pending: {
    label: "Pending",
    badgeClass: "bg-amber-100 text-amber-800",
    borderClass: "border-l-amber-400",
  },
  enroute: {
    label: "En Route",
    badgeClass: "bg-blue-100 text-blue-800",
    borderClass: "border-l-blue-500",
  },
  arrived: {
    label: "Arrived",
    badgeClass: "bg-green/10 text-green",
    borderClass: "border-l-green",
  },
  delivered: {
    label: "Delivered",
    badgeClass: "bg-green text-text-inverse",
    borderClass: "border-l-green",
  },
  skipped: {
    label: "Skipped",
    badgeClass: "bg-status-error/10 text-status-error",
    borderClass: "border-l-gray-400",
  },
};

/** Active statuses that get a pulse dot indicator */
const ACTIVE_STATUSES = new Set<RouteStopStatus>(["pending", "enroute", "arrived"]);

/** Re-export stagger item variant for parent containers */
export const stopCardItem: Variants = staggerItem;

export function StopCard({
  stopIndex,
  status,
  customerName,
  address,
  timeWindow,
  eta,
  isCurrentStop = false,
  onClick,
}: StopCardProps) {
  const config = statusConfig[status];
  const { isFullMotion, shouldAnimate } = useAnimationPreference();
  const isActive = ACTIVE_STATUSES.has(status);

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

  // ETA display
  const etaDisplay = eta ? formatTime(eta) : null;

  return (
    <m.button
      variants={stopCardItem}
      whileHover={isFullMotion ? { scale: 1.01 } : undefined}
      whileTap={isFullMotion ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        "w-full rounded-xl bg-surface-primary p-4 text-left shadow-sm",
        "border border-border border-l-4",
        config.borderClass,
        "transition-shadow duration-fast",
        isCurrentStop && "ring-2 ring-accent-teal ring-offset-2"
      )}
      data-testid="stop-card"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left side */}
        <div className="flex-1 min-w-0">
          {/* Stop number and name */}
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-text-primary font-body text-xs font-bold text-text-inverse">
              {stopIndex}
            </span>
            <span className="font-body font-medium text-text-primary truncate">
              {customerName || "Customer"}
            </span>
          </div>

          {/* Address */}
          <div className="flex items-start gap-1.5 font-body text-sm text-text-secondary">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="line-clamp-2">
              {address.line1}
              {address.line2 && `, ${address.line2}`}
              {`, ${address.city}`}
            </span>
          </div>

          {/* Time window or ETA */}
          {(etaDisplay || timeDisplay) && (
            <div className="flex items-center gap-1.5 mt-1.5 font-body text-sm text-text-muted">
              <Clock className="h-3.5 w-3.5" />
              <span>{etaDisplay ? `ETA ${etaDisplay}` : timeDisplay}</span>
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex flex-col items-end gap-2">
          {/* Status badge with pulse dot for active */}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-body text-xs font-medium",
              config.badgeClass
            )}
          >
            {shouldAnimate && isActive && (
              <m.span
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.5, repeat: 5 }}
                className="inline-block h-1.5 w-1.5 rounded-full bg-current"
              />
            )}
            {config.label}
          </span>

          {/* Chevron */}
          <ChevronRight className="h-5 w-5 text-text-muted" />
        </div>
      </div>
    </m.button>
  );
}
