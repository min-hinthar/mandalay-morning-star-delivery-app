/**
 * StarRating - 1-5 star tap rating with scale animation
 *
 * Accessible radiogroup of star buttons with haptic feedback and
 * Framer Motion tap/hover animations.
 */

"use client";

import { m } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const SIZE_MAP = {
  sm: "h-5 w-5",
  md: "h-7 w-7",
  lg: "h-9 w-9",
} as const;

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StarRating({
  value,
  onChange,
  disabled = false,
  size = "md",
  className,
}: StarRatingProps) {
  const iconSize = SIZE_MAP[size];

  const handleSelect = (rating: number) => {
    if (disabled) return;
    // Haptic feedback on tap
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(30);
    }
    onChange(rating);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Rate your delivery"
      className={cn("inline-flex items-center gap-1", className)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= value;
        return (
          <m.button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
            disabled={disabled}
            onClick={() => handleSelect(star)}
            whileTap={disabled ? undefined : { scale: 0.8 }}
            whileHover={disabled ? undefined : { scale: 1.2 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={cn(
              "rounded-full p-1 outline-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-saffron-400 focus-visible:ring-offset-2",
              disabled
                ? "cursor-default opacity-70"
                : "cursor-pointer hover:bg-saffron-50"
            )}
          >
            <Star
              className={cn(
                iconSize,
                "transition-colors duration-200",
                isFilled
                  ? "fill-saffron-500 text-saffron-500"
                  : "fill-none text-charcoal-300"
              )}
            />
          </m.button>
        );
      })}
    </div>
  );
}
