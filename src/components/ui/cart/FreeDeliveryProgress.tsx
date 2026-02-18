"use client";

/**
 * FreeDeliveryProgress Component
 * Animated progress bar toward free delivery threshold
 *
 * Two visual states:
 * - Progress: animated truck on road-styled track
 * - Celebration: green badge with party popper when threshold met
 */

import { m } from "framer-motion";
import { Truck, Sparkles, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { FREE_DELIVERY_THRESHOLD_CENTS } from "@/types/cart";

// ============================================
// TYPES
// ============================================

export interface FreeDeliveryProgressProps {
  /** Remaining cents until free delivery (0 = free delivery unlocked) */
  amountToFreeDelivery: number;
  /** Additional className */
  className?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function FreeDeliveryProgress({
  amountToFreeDelivery,
  className,
}: FreeDeliveryProgressProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  const progressPercent = Math.min(
    100,
    ((FREE_DELIVERY_THRESHOLD_CENTS - amountToFreeDelivery) / FREE_DELIVERY_THRESHOLD_CENTS) * 100
  );

  const hasFreeDelivery = amountToFreeDelivery === 0;

  return (
    <div className={className}>
      {/* Progress state */}
      {!hasFreeDelivery && (
        <m.div
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={getSpring(spring.gentle)}
          className={cn(
            "p-4 rounded-xl",
            "bg-gradient-cart-summary",
            "border border-amber-200/60 dark:border-amber-800/40",
            "shadow-sm"
          )}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-text-money">
              ${(amountToFreeDelivery / 100).toFixed(2)} away from free delivery!
            </span>
          </div>

          {/* Enhanced progress bar with truck */}
          <div className="relative">
            {/* Track background with gradient */}
            <div className="h-3 bg-gradient-delivery-track rounded-full overflow-visible relative">
              {/* Dashed road effect */}
              <div className="absolute inset-y-0 inset-x-2 flex items-center justify-evenly">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-0.5 bg-amber-300/50 dark:bg-amber-700/50 rounded-full"
                  />
                ))}
              </div>

              {/* Filled progress */}
              <m.div
                className={cn(
                  "h-full rounded-full relative",
                  "bg-gradient-progress",
                  "shadow-glow-amber"
                )}
                animate={{ width: `${progressPercent}%` }}
                transition={getSpring(spring.rubbery)}
              />
            </div>

            {/* Truck on progress */}
            <m.div
              className="absolute top-1/2 -translate-y-1/2"
              animate={{ left: `calc(${progressPercent}% - 12px)` }}
              transition={getSpring(spring.rubbery)}
            >
              <div
                className={cn(
                  "flex items-center justify-center",
                  "w-6 h-6 rounded-full",
                  "bg-surface-primary dark:bg-surface-tertiary",
                  "border-2 border-amber-500",
                  "shadow-lg"
                )}
              >
                <Truck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              </div>
            </m.div>

            {/* Goal flag at end */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2">
              <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-700 flex items-center justify-center">
                <span className="text-xs">🏁</span>
              </div>
            </div>
          </div>

          {/* Progress percentage */}
          <div className="flex justify-between items-center mt-2 text-xs">
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              {Math.round(progressPercent)}% there
            </span>
            <span className="text-text-money font-medium">Free at $100</span>
          </div>
        </m.div>
      )}

      {/* Celebration state */}
      {hasFreeDelivery && (
        <m.div
          initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
          animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
          transition={getSpring(spring.ultraBouncy)}
          className={cn(
            "p-4 rounded-xl relative overflow-hidden",
            "bg-gradient-delivery-success",
            "border border-green-200/60 dark:border-green-800/40",
            "shadow-sm"
          )}
        >
          <div className="flex items-center gap-3 relative">
            <div
              className={cn(
                "flex items-center justify-center",
                "w-10 h-10 rounded-full",
                "bg-green-100 dark:bg-green-900/50",
                "border border-green-300 dark:border-green-700"
              )}
            >
              <Truck className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-green-700 dark:text-green-300">
                  Free Delivery Unlocked!
                </span>
                <PartyPopper className="w-4 h-4 text-green-500" />
              </div>
              <span className="text-xs text-green-600/80 dark:text-green-400/80">
                You&apos;ve hit the $100 threshold
              </span>
            </div>
          </div>
        </m.div>
      )}
    </div>
  );
}

export default FreeDeliveryProgress;
