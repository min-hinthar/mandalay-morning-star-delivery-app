"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { ChevronDown, MapPin, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export interface HistoryStopData {
  id: string;
  status: string;
  address: string;
  deliveredAt: string | null;
}

export interface HistoryRouteData {
  id: string;
  date: string;
  stopCount: number;
  deliveredCount: number;
  onTimePercentage: number;
  totalDurationMinutes: number | null;
  stops: HistoryStopData[];
}

interface HistorySummaryCardProps {
  route: HistoryRouteData;
  index: number;
}

// ============================================
// HELPERS
// ============================================

function getOnTimeColor(pct: number): string {
  if (pct >= 90) return "text-green";
  if (pct >= 75) return "text-secondary";
  return "text-status-error";
}

function getOnTimeBg(pct: number): string {
  if (pct >= 90) return "bg-green/10";
  if (pct >= 75) return "bg-secondary/10";
  return "bg-status-error/10";
}

function formatTime(isoString: string | null): string {
  if (!isoString) return "--";
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(isoString));
  } catch {
    return "--";
  }
}

// ============================================
// COMPONENT
// ============================================

export function HistorySummaryCard({ route, index }: HistorySummaryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { shouldAnimate, getSpring } = useAnimationPreference();

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const deliveryDate = new Date(route.date + "T00:00:00");
  const displayDate = dateFormatter.format(deliveryDate);

  const hours = route.totalDurationMinutes
    ? (route.totalDurationMinutes / 60).toFixed(1)
    : null;

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{ ...getSpring(spring.default), delay: index * 0.04 }}
      whileHover={shouldAnimate ? { scale: 1.01 } : undefined}
      className={cn(
        "rounded-xl bg-surface-primary overflow-hidden",
        "shadow-sm border border-border cursor-pointer",
        "transition-shadow hover:shadow-md"
      )}
      onClick={() => setExpanded((prev) => !prev)}
    >
      {/* Collapsed row */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-text-primary">{displayDate}</p>
          <m.div
            animate={shouldAnimate ? { rotate: expanded ? 180 : 0 } : undefined}
            transition={getSpring(spring.snappy)}
          >
            <ChevronDown className="h-5 w-5 text-text-muted" />
          </m.div>
        </div>

        <div className="mt-2 flex items-center gap-4 text-sm text-text-secondary">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {route.stopCount} stops
          </span>
          <span
            className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium",
              getOnTimeBg(route.onTimePercentage),
              getOnTimeColor(route.onTimePercentage)
            )}
          >
            <CheckCircle className="h-3 w-3" />
            {route.onTimePercentage}%
          </span>
          {hours && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {hours} hrs
            </span>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <m.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={getSpring(spring.snappy)}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4 pb-4 pt-3">
              {route.stops.length === 0 ? (
                <p className="text-sm text-text-muted">No stop details available</p>
              ) : (
                <div className="space-y-2">
                  {route.stops.map((stop, idx) => {
                    const isDelivered = stop.status === "delivered";
                    const isSkipped = stop.status === "skipped";
                    return (
                      <div
                        key={stop.id}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2",
                          isDelivered && "bg-green/5",
                          isSkipped && "bg-status-error/5",
                          !isDelivered && !isSkipped && "bg-surface-secondary"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-medium text-text-muted w-5 shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="text-sm text-text-primary truncate">
                            {stop.address}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {stop.deliveredAt && (
                            <span className="text-xs text-text-muted">
                              {formatTime(stop.deliveredAt)}
                            </span>
                          )}
                          <span
                            className={cn(
                              "text-xs font-medium px-1.5 py-0.5 rounded-full",
                              isDelivered && "bg-green/10 text-green",
                              isSkipped && "bg-status-error/10 text-status-error",
                              !isDelivered &&
                                !isSkipped &&
                                "bg-surface-tertiary text-text-muted"
                            )}
                          >
                            {stop.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}
