"use client";

import { m } from "framer-motion";
import {
  CheckCircle,
  Truck,
  Clock,
  XCircle,
  SkipForward,
} from "lucide-react";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { staggerContainer, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import type { RouteStopStatus, StopDetail } from "@/types/driver";

// ============================================
// TYPES
// ============================================

interface RouteTimelineProps {
  stops: StopDetail[];
}

// ============================================
// STATUS CONFIG
// ============================================

const STATUS_CONFIG: Record<
  RouteStopStatus,
  { color: string; bgColor: string; borderColor: string; icon: React.ReactNode }
> = {
  delivered: {
    color: "text-status-success",
    bgColor: "bg-status-success",
    borderColor: "border-status-success",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  enroute: {
    color: "text-status-in-transit",
    bgColor: "bg-status-in-transit",
    borderColor: "border-status-in-transit",
    icon: <Truck className="h-3.5 w-3.5" />,
  },
  arrived: {
    color: "text-status-in-transit",
    bgColor: "bg-status-in-transit",
    borderColor: "border-status-in-transit",
    icon: <Truck className="h-3.5 w-3.5" />,
  },
  pending: {
    color: "text-text-muted",
    bgColor: "bg-text-muted",
    borderColor: "border-text-muted",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  skipped: {
    color: "text-secondary",
    bgColor: "bg-secondary",
    borderColor: "border-secondary",
    icon: <SkipForward className="h-3.5 w-3.5" />,
  },
};

// ============================================
// HELPERS
// ============================================

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return format(parseISO(dateStr), "h:mm a");
  } catch {
    return "";
  }
}

function getTimeBetween(prevStop: StopDetail, currentStop: StopDetail): string | null {
  const prevTime = prevStop.deliveredAt || prevStop.arrivedAt || prevStop.eta;
  const curTime = currentStop.arrivedAt || currentStop.eta;
  if (!prevTime || !curTime) return null;

  try {
    const minutes = Math.abs(differenceInMinutes(parseISO(curTime), parseISO(prevTime)));
    return `${minutes} min`;
  } catch {
    return null;
  }
}

// ============================================
// TIMELINE STOP
// ============================================

interface TimelineStopProps {
  stop: StopDetail;
  index: number;
  isLast: boolean;
  timeBetween: string | null;
}

function TimelineStop({ stop, index, isLast, timeBetween }: TimelineStopProps) {
  const { shouldAnimate } = useAnimationPreference();
  const config = STATUS_CONFIG[stop.status];
  const hasException = stop.exception && !stop.exception.resolved;
  const deliveryTime = formatTime(stop.deliveredAt) || formatTime(stop.arrivedAt) || formatTime(stop.eta);

  return (
    <m.div
      variants={staggerItem}
      className="relative flex gap-4"
    >
      {/* Left column: dot + connecting line */}
      <div className="flex flex-col items-center">
        {/* Dot */}
        <m.div
          initial={shouldAnimate ? { scale: 0 } : undefined}
          animate={shouldAnimate ? { scale: 1 } : undefined}
          transition={shouldAnimate ? { delay: index * 0.1, type: "spring", stiffness: 300 } : undefined}
          className={cn(
            "relative z-10 flex items-center justify-center",
            "w-8 h-8 rounded-full border-2",
            "bg-surface-primary",
            config.borderColor,
            hasException && "ring-2 ring-status-error/30"
          )}
        >
          <span className={config.color}>{config.icon}</span>
        </m.div>

        {/* Connecting line */}
        {!isLast && (
          <div className="relative flex-1 w-0.5 min-h-[2rem]">
            <div className="absolute inset-0 bg-border" />
            {/* Time between stops label */}
            {timeBetween && (
              <div className="absolute top-1/2 -translate-y-1/2 left-3 whitespace-nowrap">
                <span className="text-2xs font-medium text-text-muted bg-surface-primary px-1.5 py-0.5 rounded border border-border">
                  {timeBetween}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right column: stop info card */}
      <div
        className={cn(
          "flex-1 pb-6 min-w-0",
          isLast && "pb-0"
        )}
      >
        <div
          className={cn(
            "rounded-xl bg-surface-primary border p-3 shadow-sm",
            hasException ? "border-status-error/30 border-l-4 border-l-status-error" : "border-border",
            stop.status === "delivered" && "border-l-4 border-l-status-success",
            stop.status === "enroute" && "border-l-4 border-l-status-in-transit",
            stop.status === "arrived" && "border-l-4 border-l-status-in-transit",
            stop.status === "pending" && "border-l-4 border-l-border",
            stop.status === "skipped" && "border-l-4 border-l-secondary"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-text-primary text-sm truncate">
                Stop {index + 1}: {stop.order?.customer?.fullName || "Unknown Customer"}
              </p>
              {stop.order?.address && (
                <p className="text-xs text-text-secondary mt-0.5 truncate">
                  {stop.order.address.line1}, {stop.order.address.city}
                </p>
              )}
            </div>
            {deliveryTime && (
              <span className="text-xs text-text-muted whitespace-nowrap flex-shrink-0">
                {deliveryTime}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-2xs font-medium px-2 py-0.5 rounded-full",
                stop.status === "delivered" && "bg-status-success/10 text-status-success",
                stop.status === "enroute" && "bg-status-in-transit/10 text-status-in-transit",
                stop.status === "arrived" && "bg-status-in-transit/10 text-status-in-transit",
                stop.status === "pending" && "bg-surface-tertiary text-text-muted",
                stop.status === "skipped" && "bg-secondary/10 text-secondary"
              )}
            >
              {config.icon}
              {stop.status.charAt(0).toUpperCase() + stop.status.slice(1)}
            </span>

            {hasException && (
              <span className="inline-flex items-center gap-1 text-2xs font-medium px-2 py-0.5 rounded-full bg-status-error/10 text-status-error">
                <XCircle className="h-3 w-3" />
                Exception
              </span>
            )}
          </div>
        </div>
      </div>
    </m.div>
  );
}

// ============================================
// ROUTE TIMELINE
// ============================================

export function RouteTimeline({ stops }: RouteTimelineProps) {
  const { shouldAnimate } = useAnimationPreference();
  const sortedStops = [...stops].sort((a, b) => a.stopIndex - b.stopIndex);

  if (sortedStops.length === 0) return null;

  return (
    <m.div
      variants={shouldAnimate ? staggerContainer(0.04, 0.1) : undefined}
      initial="hidden"
      animate="visible"
      className="py-2"
    >
      <h2 className="text-lg font-display text-text-primary mb-4">
        Timeline ({sortedStops.length} stops)
      </h2>

      <div className="ml-1">
        {sortedStops.map((stop, index) => (
          <TimelineStop
            key={stop.id}
            stop={stop}
            index={index}
            isLast={index === sortedStops.length - 1}
            timeBetween={
              index > 0 ? getTimeBetween(sortedStops[index - 1], stop) : null
            }
          />
        ))}
      </div>
    </m.div>
  );
}
