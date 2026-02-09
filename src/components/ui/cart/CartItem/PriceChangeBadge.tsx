"use client";

import { memo, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

export interface PriceChangeBadgeProps {
  direction: "up" | "down";
  onDismiss: () => void;
  /** Controls visibility for AnimatePresence exit */
  visible?: boolean;
}

const directionConfig = {
  up: {
    Icon: TrendingUp,
    bg: "bg-amber-100 dark:bg-amber-900/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200/60 dark:border-amber-700/40",
  },
  down: {
    Icon: TrendingDown,
    bg: "bg-green-100 dark:bg-green-900/40",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200/60 dark:border-green-700/40",
  },
} as const;

export const PriceChangeBadge = memo(function PriceChangeBadge({
  direction,
  onDismiss,
  visible = true,
}: PriceChangeBadgeProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const config = directionConfig[direction];
  const Icon = config.Icon;

  const handleDismiss = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDismiss();
    },
    [onDismiss]
  );

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <m.button
          type="button"
          key="price-change-badge"
          initial={shouldAnimate ? { opacity: 0, x: 20 } : undefined}
          animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
          exit={shouldAnimate ? { opacity: 0, x: 20 } : undefined}
          transition={shouldAnimate ? getSpring(spring.snappy) : undefined}
          onClick={handleDismiss}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
            "text-xs font-medium cursor-pointer",
            "border",
            config.bg,
            config.text,
            config.border,
            "hover:opacity-80 active:opacity-70 transition-opacity",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          )}
          aria-label={`Dismiss price ${direction === "up" ? "increase" : "decrease"} notification`}
        >
          <Icon className="w-3 h-3" />
          <span>Price updated</span>
          <X className="w-3 h-3 ml-0.5 opacity-60" />
        </m.button>
      )}
    </AnimatePresence>
  );
});

export default PriceChangeBadge;
