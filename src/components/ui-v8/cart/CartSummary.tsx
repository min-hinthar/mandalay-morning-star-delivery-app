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
import { Sparkles } from "lucide-react";
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
            "p-3 rounded-lg",
            "bg-amber-50 dark:bg-amber-950/30",
            "border border-amber-200/50 dark:border-amber-800/30"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <motion.div
              animate={
                shouldAnimate
                  ? {
                      rotate: [0, 15, -15, 0],
                      scale: [1, 1.1, 1.1, 1],
                    }
                  : undefined
              }
              transition={{
                duration: 0.6,
                repeat: Infinity,
                repeatDelay: 2,
              }}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
            </motion.div>
            <span className="text-sm font-medium text-text-primary">
              ${(amountToFreeDelivery / 100).toFixed(2)} away from free delivery!
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                "bg-gradient-to-r from-amber-400 to-amber-500"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={getSpring(spring.rubbery)}
            />
          </div>
        </motion.div>
      )}

      {/* Free delivery achieved message */}
      {hasFreeDelivery && (
        <motion.div
          initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
          animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
          transition={getSpring(spring.ultraBouncy)}
          className={cn(
            "p-3 rounded-lg",
            "bg-green-50 dark:bg-green-950/30",
            "border border-green-200/50 dark:border-green-800/30"
          )}
        >
          <div className="flex items-center gap-2">
            <motion.div
              animate={
                shouldAnimate
                  ? {
                      scale: [1, 1.2, 1],
                    }
                  : undefined
              }
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            >
              <Sparkles className="w-4 h-4 text-green-500" />
            </motion.div>
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              You qualify for free delivery!
            </span>
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
