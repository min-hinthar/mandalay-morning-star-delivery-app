"use client";

/**
 * CheckoutSummaryV8 Component
 * Order summary with animated free delivery progress indicator
 *
 * Features:
 * - Animated progress bar with spring.rubbery for free delivery threshold
 * - Celebration animation when free delivery is achieved
 * - Staggered item list animation
 * - PriceTicker for animated price updates
 * - Respects animation preferences
 */

import { m, AnimatePresence } from "framer-motion";
import { ShoppingBag, Truck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring, staggerItem, staggerContainer } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useCart } from "@/lib/hooks/useCart";
import { PriceTicker } from "@/components/ui/PriceTicker";
import { formatPrice } from "@/lib/utils/format";

// ============================================
// TYPES
// ============================================

export interface CheckoutSummaryV8Props {
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

export function CheckoutSummaryV8({ className }: CheckoutSummaryV8Props) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const {
    items,
    itemsSubtotal,
    estimatedDeliveryFee,
    estimatedTotal,
    amountToFreeDelivery,
    freeDeliveryThresholdCents,
  } = useCart();

  // Calculate progress percentage toward free delivery
  const progressPercent = Math.min(
    100,
    ((freeDeliveryThresholdCents - amountToFreeDelivery) / freeDeliveryThresholdCents) * 100
  );

  const hasFreeDelivery = amountToFreeDelivery <= 0;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-surface-primary shadow-lg",
        className
      )}
    >
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-r from-primary/5 to-transparent px-5 py-4">
        <h3 className="flex items-center gap-2 font-bold text-text-primary">
          <ShoppingBag className="h-5 w-5 text-primary" />
          Order Summary
        </h3>
      </div>

      {/* Items */}
      <m.ul
        variants={shouldAnimate ? staggerContainer(0.05, 0.1) : undefined}
        initial={shouldAnimate ? "hidden" : undefined}
        animate={shouldAnimate ? "visible" : undefined}
        className="max-h-64 space-y-3 overflow-y-auto px-5 py-4"
      >
        {/* CHANGED from mode="popLayout" to mode="sync" - popLayout causes layout thrashing that crashes mobile */}
        <AnimatePresence mode="sync">
          {items.map((item) => {
            const itemTotal =
              (item.basePriceCents +
                item.modifiers.reduce((sum, m) => sum + m.priceDeltaCents, 0)) *
              item.quantity;

            return (
              <m.li
                key={item.cartItemId}
                variants={shouldAnimate ? staggerItem : undefined}
                initial={shouldAnimate ? "hidden" : undefined}
                animate={shouldAnimate ? "visible" : undefined}
                exit={shouldAnimate ? "exit" : undefined}
                // REMOVED layout prop - causes expensive layout recalculations that crash mobile
                className="flex justify-between text-sm"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-1.5">
                    <m.span
                      className="inline-flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary"
                      initial={shouldAnimate ? { scale: 0 } : undefined}
                      animate={shouldAnimate ? { scale: 1 } : undefined}
                      transition={getSpring(spring.ultraBouncy)}
                    >
                      {item.quantity}
                    </m.span>
                    <span className="font-medium text-text-primary truncate">{item.nameEn}</span>
                  </div>
                  {item.modifiers.length > 0 && (
                    <p className="mt-1 text-xs text-text-muted truncate pl-6">
                      {item.modifiers.map((m) => m.optionName).join(", ")}
                    </p>
                  )}
                </div>
                <span className="font-semibold text-text-primary flex-shrink-0">
                  <PriceTicker value={itemTotal} inCents={true} size="sm" />
                </span>
              </m.li>
            );
          })}
        </AnimatePresence>
      </m.ul>

      {/* Totals */}
      <div className="border-t border-border bg-surface-secondary/80 px-5 py-4 space-y-3">
        {/* Free delivery progress indicator */}
        {!hasFreeDelivery && (
          <m.div
            initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
            transition={getSpring(spring.gentle)}
            className={cn(
              "p-3 rounded-lg",
              "bg-status-warning-bg",
              "border border-status-warning/20"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <m.div
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
                  repeat: 5,
                  repeatDelay: 2,
                }}
              >
                <Sparkles className="w-4 h-4 text-status-warning" />
              </m.div>
              <span className="text-sm font-medium text-text-money">
                {formatPrice(amountToFreeDelivery)} more for free delivery!
              </span>
            </div>

            {/* Animated progress bar */}
            <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
              <m.div
                className="h-full rounded-full bg-gradient-progress"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={getSpring(spring.rubbery)}
              />
            </div>
          </m.div>
        )}

        {/* Free delivery achieved celebration */}
        {hasFreeDelivery && (
          <m.div
            initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
            animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
            transition={getSpring(spring.ultraBouncy)}
            className={cn(
              "p-3 rounded-lg",
              "bg-status-success-bg",
              "border border-status-success/20"
            )}
          >
            <div className="flex items-center gap-2">
              <m.div
                animate={
                  shouldAnimate
                    ? {
                        scale: [1, 1.2, 1],
                      }
                    : undefined
                }
                transition={{
                  duration: 0.5,
                  repeat: 5,
                  repeatDelay: 3,
                }}
              >
                <Sparkles className="w-4 h-4 text-status-success" />
              </m.div>
              <span className="text-sm font-medium text-status-success">
                You qualify for free delivery!
              </span>
            </div>
          </m.div>
        )}

        {/* Subtotal */}
        <m.div
          variants={shouldAnimate ? summaryRowVariants : undefined}
          initial={shouldAnimate ? "hidden" : undefined}
          animate={shouldAnimate ? "visible" : undefined}
          className="flex justify-between text-sm text-text-muted"
        >
          <span>Subtotal</span>
          <PriceTicker value={itemsSubtotal} inCents={true} size="sm" className="text-text-money" />
        </m.div>

        {/* Delivery Fee */}
        <m.div
          variants={shouldAnimate ? summaryRowVariants : undefined}
          initial={shouldAnimate ? "hidden" : undefined}
          animate={shouldAnimate ? "visible" : undefined}
          transition={{ delay: 0.05 }}
          className="flex justify-between text-sm text-text-muted"
        >
          <span className="flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5" />
            Delivery
          </span>
          {hasFreeDelivery ? (
            <m.span
              initial={shouldAnimate ? { scale: 0.8, opacity: 0 } : undefined}
              animate={shouldAnimate ? { scale: 1, opacity: 1 } : undefined}
              transition={getSpring(spring.ultraBouncy)}
              className="text-text-money font-semibold flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              FREE
            </m.span>
          ) : (
            <PriceTicker
              value={estimatedDeliveryFee}
              inCents={true}
              size="sm"
              className="text-text-money"
            />
          )}
        </m.div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Total */}
        <m.div
          variants={shouldAnimate ? summaryRowVariants : undefined}
          initial={shouldAnimate ? "hidden" : undefined}
          animate={shouldAnimate ? "visible" : undefined}
          transition={{ delay: 0.1 }}
          className="flex justify-between items-center"
        >
          <span className="text-base font-bold text-text-primary">Estimated Total</span>
          <PriceTicker
            value={estimatedTotal}
            inCents={true}
            size="lg"
            className="text-text-money font-bold"
          />
        </m.div>

        <p className="text-xs text-text-muted text-center">Tax calculated at checkout</p>
      </div>
    </div>
  );
}

export default CheckoutSummaryV8;
