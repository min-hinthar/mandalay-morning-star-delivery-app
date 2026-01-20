/**
 * V6 ETA Display Component - Pepper Aesthetic
 *
 * Shows estimated time of arrival with a range and arrival time.
 * Features V6 colors, spring animations, and gradient background.
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock, Navigation } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatETARange, formatArrivalTime } from "@/lib/utils/eta";
import { Skeleton } from "@/components/ui/skeleton";
import { v6Spring } from "@/lib/motion";

interface ETADisplayProps {
  minMinutes: number;
  maxMinutes: number;
  estimatedArrival: string;
  isCalculating?: boolean;
  className?: string;
}

export function ETADisplay({
  minMinutes,
  maxMinutes,
  estimatedArrival,
  isCalculating = false,
  className,
}: ETADisplayProps) {
  const formattedRange = formatETARange(minMinutes, maxMinutes);
  const formattedTime = formatArrivalTime(new Date(estimatedArrival));

  if (isCalculating) {
    return (
      <div
        className={cn(
          "rounded-v6-card bg-gradient-to-r from-v6-primary-light to-v6-green-light p-5",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={v6Spring}
      className={cn(
        "rounded-v6-card bg-gradient-to-r from-v6-primary-light to-v6-green-light p-5 shadow-v6-card",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {/* V6 Icon */}
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-v6-primary/10">
          <Navigation className="h-7 w-7 text-v6-primary" />
        </div>

        {/* V6 ETA Content */}
        <div className="flex-1">
          <p className="text-sm font-v6-body font-medium text-v6-text-secondary">
            Estimated Arrival
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={formattedRange}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="text-2xl font-v6-display font-bold text-v6-text-primary"
            >
              {formattedRange}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* V6 Arrival Time */}
        <div className="text-right">
          <p className="text-xs font-v6-body text-v6-text-muted">Arriving by</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={formattedTime}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="text-lg font-v6-display font-bold text-v6-green"
            >
              {formattedTime}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* V6 Progress indicator */}
      <div className="mt-3 flex items-center gap-2 text-xs font-v6-body text-v6-text-muted">
        <Clock className="h-3 w-3" />
        <span>Updates as driver progresses</span>
      </div>
    </motion.div>
  );
}

/**
 * V6 Compact ETA display for smaller spaces
 */
export function ETADisplayCompact({
  minMinutes,
  maxMinutes,
  className,
}: Pick<ETADisplayProps, "minMinutes" | "maxMinutes" | "className">) {
  const formattedRange = formatETARange(minMinutes, maxMinutes);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={v6Spring}
      className={cn(
        "inline-flex items-center gap-2 rounded-v6-pill bg-v6-primary-light px-4 py-2",
        "text-sm font-v6-body font-semibold text-v6-primary",
        className
      )}
    >
      <Navigation className="h-4 w-4" />
      <span>{formattedRange}</span>
    </motion.div>
  );
}
