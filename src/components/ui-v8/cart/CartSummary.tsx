"use client";

/**
 * CartSummary Component
 * Order summary with animated free delivery progress indicator
 *
 * Features:
 * - Animated progress bar for free delivery threshold
 * - PriceTicker for subtotal, delivery fee, and total
 * - Spring animations with rubbery feel
 * - Respects animation preferences
 */

import { motion } from "framer-motion";
import { Truck, Sparkles, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useCart } from "@/lib/hooks/useCart";
import { PriceTicker } from "@/components/ui/PriceTicker";
import { FREE_DELIVERY_THRESHOLD_CENTS } from "@/types/cart";

// ============================================
// TYPES
// ============================================

export interface CartSummaryProps {
  /** Additional className */
  className?: string;
}

// ============================================
// ANIMATION VARIANTS
// ============================================

const summaryRowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
};

// ============================================
// MAIN COMPONENT
// ============================================

export function CartSummary({ className }: CartSummaryProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const {
    itemsSubtotal,
    estimatedDeliveryFee,
    estimatedTotal,
    amountToFreeDelivery,
  } = useCart();

  // Calculate progress percentage toward free delivery
  const progressPercent = Math.min(
    100,
    ((FREE_DELIVERY_THRESHOLD_CENTS - amountToFreeDelivery) /
      FREE_DELIVERY_THRESHOLD_CENTS) *
      100
  );

  const hasFreeDelivery = amountToFreeDelivery <= 0;

  return (
    <motion.div
      variants={shouldAnimate ? staggerItem : undefined}
      className={cn("space-y-3", className)}
    >
      {/* Free delivery progress indicator */}
      {!hasFreeDelivery && (
        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={getSpring(spring.gentle)}
          className={cn(
            "p-4 rounded-xl",
            "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30",
            "border border-amber-200/60 dark:border-amber-800/40",
            "shadow-sm"
          )}
        >
          <div className="flex items-center gap-2 mb-3">
            <motion.div
              animate={
                shouldAnimate
                  ? {
                      rotate: [0, 5, -5, 0],
                      y: [0, -2, 0],
                    }
                  : undefined
              }
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 1.5,
              }}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
            </motion.div>
            <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              ${(amountToFreeDelivery / 100).toFixed(2)} away from free delivery!
            </span>
          </div>

          {/* Enhanced progress bar with truck */}
          <div className="relative">
            {/* Track background with gradient */}
            <div className="h-3 bg-gradient-to-r from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50 rounded-full overflow-visible relative">
              {/* Dashed road effect */}
              <div className="absolute inset-y-0 inset-x-2 flex items-center justify-evenly">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-0.5 bg-amber-300/50 dark:bg-amber-700/50 rounded-full"
                  />
                ))}
              </div>

              {/* Filled progress - key ensures animation triggers on value change */}
              <motion.div
                key={`summary-progress-${Math.round(progressPercent)}`}
                className={cn(
                  "h-full rounded-full relative",
                  "bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500",
                  "shadow-[0_2px_8px_rgba(245,158,11,0.4)]"
                )}
                initial={{ width: `${Math.max(0, progressPercent - 10)}%` }}
                animate={{ width: `${progressPercent}%` }}
                transition={getSpring(spring.rubbery)}
              />
            </div>

            {/* Animated truck on progress - key ensures position updates on value change */}
            <motion.div
              key={`summary-truck-${Math.round(progressPercent)}`}
              className="absolute top-1/2 -translate-y-1/2"
              initial={{ left: `calc(${Math.max(0, progressPercent - 10)}% - 12px)` }}
              animate={{ left: `calc(${progressPercent}% - 12px)` }}
              transition={getSpring(spring.rubbery)}
            >
              <motion.div
                animate={
                  shouldAnimate
                    ? {
                        y: [0, -2, 0],
                        rotate: [0, -3, 3, 0],
                      }
                    : undefined
                }
                transition={{
                  duration: 0.4,
                  repeat: Infinity,
                  repeatDelay: 0.1,
                }}
                className={cn(
                  "flex items-center justify-center",
                  "w-6 h-6 rounded-full",
                  "bg-white dark:bg-zinc-800",
                  "border-2 border-amber-500",
                  "shadow-lg"
                )}
              >
                <Truck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              </motion.div>
            </motion.div>

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
            <span className="text-text-muted">
              Free at $100
            </span>
          </div>
        </motion.div>
      )}

      {/* Free delivery achieved message - key triggers animation when threshold crossed */}
      {hasFreeDelivery && (
        <motion.div
          key="summary-free-delivery-unlocked"
          initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
          animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
          transition={getSpring(spring.ultraBouncy)}
          className={cn(
            "p-4 rounded-xl relative overflow-hidden",
            "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/30",
            "border border-green-200/60 dark:border-green-800/40",
            "shadow-sm"
          )}
        >
          {/* Celebration sparkles background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {shouldAnimate && [...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-green-400/60"
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  y: [0, -20],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                  repeatDelay: 1,
                }}
                style={{
                  left: `${20 + i * 15}%`,
                  top: "80%",
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-3 relative">
            <motion.div
              animate={
                shouldAnimate
                  ? {
                      rotate: [0, -10, 10, 0],
                      scale: [1, 1.15, 1],
                    }
                  : undefined
              }
              transition={{
                duration: 0.6,
                repeat: Infinity,
                repeatDelay: 2,
              }}
              className={cn(
                "flex items-center justify-center",
                "w-10 h-10 rounded-full",
                "bg-green-100 dark:bg-green-900/50",
                "border border-green-300 dark:border-green-700"
              )}
            >
              <Truck className="w-5 h-5 text-green-600 dark:text-green-400" />
            </motion.div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-green-700 dark:text-green-300">
                  Free Delivery Unlocked!
                </span>
                <motion.div
                  animate={shouldAnimate ? { rotate: [0, 15, -15, 0] } : undefined}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <PartyPopper className="w-4 h-4 text-green-500" />
                </motion.div>
              </div>
              <span className="text-xs text-green-600/80 dark:text-green-400/80">
                You&apos;ve hit the $100 threshold
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Summary rows */}
      <div className="space-y-2 text-sm">
        {/* Subtotal */}
        <motion.div
          variants={shouldAnimate ? summaryRowVariants : undefined}
          initial={shouldAnimate ? "hidden" : undefined}
          animate={shouldAnimate ? "visible" : undefined}
          className="flex justify-between text-text-secondary"
        >
          <span>Subtotal</span>
          <PriceTicker value={itemsSubtotal} inCents={true} />
        </motion.div>

        {/* Delivery Fee */}
        <motion.div
          variants={shouldAnimate ? summaryRowVariants : undefined}
          initial={shouldAnimate ? "hidden" : undefined}
          animate={shouldAnimate ? "visible" : undefined}
          transition={{ delay: 0.05 }}
          className="flex justify-between text-text-secondary"
        >
          <span>Delivery Fee</span>
          {hasFreeDelivery ? (
            <motion.span
              initial={shouldAnimate ? { scale: 0.8, opacity: 0 } : undefined}
              animate={shouldAnimate ? { scale: 1, opacity: 1 } : undefined}
              transition={getSpring(spring.ultraBouncy)}
              className="text-green-600 dark:text-green-400 font-semibold"
            >
              FREE
            </motion.span>
          ) : (
            <PriceTicker value={estimatedDeliveryFee} inCents={true} />
          )}
        </motion.div>

        {/* Divider */}
        <div className="h-px bg-border my-2" />

        {/* Estimated Total */}
        <motion.div
          variants={shouldAnimate ? summaryRowVariants : undefined}
          initial={shouldAnimate ? "hidden" : undefined}
          animate={shouldAnimate ? "visible" : undefined}
          transition={{ delay: 0.1 }}
          className="flex justify-between items-center font-semibold text-base"
        >
          <span className="text-text-primary">Estimated Total</span>
          <PriceTicker
            value={estimatedTotal}
            inCents={true}
            size="lg"
            className="text-primary"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

export default CartSummary;
