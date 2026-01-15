/**
 * V2 Sprint 3: ETA Display Component
 *
 * Shows estimated time of arrival with a range and arrival time.
 * Animates smoothly when ETA updates.
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock, Navigation } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatETARange, formatArrivalTime } from "@/lib/utils/eta";
import { Skeleton } from "@/components/ui/skeleton";

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
          "rounded-xl bg-gradient-to-r from-saffron-50 to-jade-50 p-4",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
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
      className={cn(
        "rounded-xl bg-gradient-to-r from-saffron-50 to-jade-50 p-4 shadow-warm-sm",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-saffron-100">
          <Navigation className="h-6 w-6 text-saffron-600" />
        </div>

        {/* ETA Content */}
        <div className="flex-1">
          <p className="text-sm font-medium text-charcoal-600">
            Estimated Arrival
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={formattedRange}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="text-xl font-bold text-charcoal"
            >
              {formattedRange}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Arrival Time */}
        <div className="text-right">
          <p className="text-xs text-charcoal-500">Arriving by</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={formattedTime}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="text-lg font-semibold text-jade-600"
            >
              {formattedTime}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mt-3 flex items-center gap-2 text-xs text-charcoal-500">
        <Clock className="h-3 w-3" />
        <span>Updates as driver progresses</span>
      </div>
    </motion.div>
  );
}

/**
 * Compact ETA display for smaller spaces
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
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-saffron-100 px-3 py-1.5 text-sm font-medium text-saffron-800",
        className
      )}
    >
      <Navigation className="h-3.5 w-3.5" />
      <span>{formattedRange}</span>
    </motion.div>
  );
}
