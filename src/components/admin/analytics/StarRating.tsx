/**
 * V2 Sprint 4: Star Rating Component
 *
 * Animated star rating with spring physics and haptic feedback.
 * Supports interactive mode for customer feedback and readonly display.
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { StarRatingProps } from "@/types/analytics";

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

const containerSizeClasses = {
  sm: "gap-1",
  md: "gap-1.5",
  lg: "gap-2",
};

export function StarRating({
  value,
  onChange,
  size = "md",
  readonly = false,
  showLabel = false,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? value;

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className={cn("flex", containerSizeClasses[size])}>
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => handleClick(star)}
            onMouseEnter={() => !readonly && setHoverValue(star)}
            onMouseLeave={() => !readonly && setHoverValue(null)}
            whileHover={!readonly ? { scale: 1.2 } : undefined}
            whileTap={!readonly ? { scale: 0.9 } : undefined}
            className={cn(
              "relative focus:outline-none",
              !readonly && "cursor-pointer",
              readonly && "cursor-default"
            )}
          >
            {/* Background star */}
            <Star
              className={cn(
                sizeClasses[size],
                "text-charcoal-200 transition-colors"
              )}
            />

            {/* Filled star overlay */}
            <AnimatePresence>
              {star <= displayValue && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="absolute inset-0"
                >
                  <Star
                    className={cn(
                      sizeClasses[size],
                      "fill-saffron text-saffron"
                    )}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pulse effect on selection */}
            {!readonly && star <= displayValue && (
              <motion.div
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="pointer-events-none absolute inset-0"
              >
                <Star
                  className={cn(sizeClasses[size], "fill-saffron text-saffron")}
                />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      {showLabel && (
        <motion.span
          key={displayValue}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-medium text-charcoal-600"
        >
          {getRatingLabel(displayValue)}
        </motion.span>
      )}
    </div>
  );
}

function getRatingLabel(rating: number): string {
  switch (rating) {
    case 1:
      return "Poor";
    case 2:
      return "Fair";
    case 3:
      return "Good";
    case 4:
      return "Very Good";
    case 5:
      return "Excellent";
    default:
      return "";
  }
}

/**
 * Rating display with numeric value
 */
export function RatingDisplay({
  value,
  count,
  size = "md",
}: {
  value: number | null;
  count?: number;
  size?: "sm" | "md" | "lg";
}) {
  if (value === null) {
    return (
      <span className="text-sm text-charcoal-400">No ratings yet</span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Star className={cn(sizeClasses[size], "fill-saffron text-saffron")} />
      <span className="font-semibold text-charcoal-900">
        {value.toFixed(1)}
      </span>
      {count !== undefined && (
        <span className="text-sm text-charcoal-500">
          ({count} {count === 1 ? "review" : "reviews"})
        </span>
      )}
    </div>
  );
}

/**
 * Rating distribution bar chart
 */
export function RatingDistributionBars({
  distribution,
  total,
}: {
  distribution: {
    fiveStar: number;
    fourStar: number;
    threeStar: number;
    twoStar: number;
    oneStar: number;
  };
  total: number;
}) {
  const bars = [
    { label: "5", value: distribution.fiveStar },
    { label: "4", value: distribution.fourStar },
    { label: "3", value: distribution.threeStar },
    { label: "2", value: distribution.twoStar },
    { label: "1", value: distribution.oneStar },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-2"
    >
      {bars.map((bar, i) => {
        const percentage = total > 0 ? (bar.value / total) * 100 : 0;

        return (
          <motion.div
            key={bar.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3"
          >
            <div className="flex w-8 items-center gap-0.5">
              <span className="text-sm font-medium text-charcoal-600">
                {bar.label}
              </span>
              <Star className="h-3 w-3 fill-saffron text-saffron" />
            </div>

            <div className="h-2 flex-1 overflow-hidden rounded-full bg-charcoal-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                className="h-full rounded-full bg-saffron"
              />
            </div>

            <span className="w-8 text-right text-sm text-charcoal-500">
              {bar.value}
            </span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
