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

import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useCart } from "@/lib/hooks/useCart";
import { COVINA_TAX_RATE } from "@/lib/utils/order";
import { useCartStore } from "@/lib/stores/cart-store";
import { PriceTicker } from "@/components/ui/PriceTicker";
import { FreeDeliveryProgress } from "./FreeDeliveryProgress";

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
  const { itemsSubtotal, estimatedDeliveryFee, estimatedTotal, amountToFreeDelivery } = useCart();
  const addressDistanceMiles = useCartStore((s) => s.addressDistanceMiles);
  const longDistanceThresholdMiles = useCartStore((s) => s.longDistanceThresholdMiles);
  const isExtendedRange =
    addressDistanceMiles != null && addressDistanceMiles > longDistanceThresholdMiles;

  const hasFreeDelivery = amountToFreeDelivery === 0 && !isExtendedRange;
  const estimatedTaxCents = Math.round(itemsSubtotal * COVINA_TAX_RATE);

  return (
    <m.div
      variants={shouldAnimate ? staggerItem : undefined}
      className={cn("space-y-3", className)}
    >
      {/* Free delivery progress indicator */}
      <FreeDeliveryProgress
        amountToFreeDelivery={amountToFreeDelivery}
        isExtendedRange={isExtendedRange}
      />

      {/* Summary rows */}
      <div className="space-y-2 text-sm">
        {/* Subtotal */}
        <m.div
          variants={shouldAnimate ? summaryRowVariants : undefined}
          initial={shouldAnimate ? "hidden" : undefined}
          animate={shouldAnimate ? "visible" : undefined}
          className="flex justify-between text-text-secondary"
        >
          <span>Subtotal</span>
          <PriceTicker value={itemsSubtotal} inCents={true} className="text-text-money" />
        </m.div>

        {/* Delivery Fee */}
        <m.div
          variants={shouldAnimate ? summaryRowVariants : undefined}
          initial={shouldAnimate ? "hidden" : undefined}
          animate={shouldAnimate ? "visible" : undefined}
          transition={{ delay: 0.05 }}
          className="flex justify-between text-text-secondary"
        >
          <span>{isExtendedRange ? "Extended Delivery" : "Delivery Fee"}</span>
          {hasFreeDelivery ? (
            <m.span
              initial={shouldAnimate ? { scale: 0.8, opacity: 0 } : undefined}
              animate={shouldAnimate ? { scale: 1, opacity: 1 } : undefined}
              transition={getSpring(spring.ultraBouncy)}
              className="text-text-money font-semibold"
            >
              FREE
            </m.span>
          ) : (
            <PriceTicker value={estimatedDeliveryFee} inCents={true} className="text-text-money" />
          )}
        </m.div>

        {/* Estimated Tax */}
        <m.div
          variants={shouldAnimate ? summaryRowVariants : undefined}
          initial={shouldAnimate ? "hidden" : undefined}
          animate={shouldAnimate ? "visible" : undefined}
          transition={{ delay: 0.1 }}
          className="flex justify-between text-text-secondary"
        >
          <span>Est. Tax</span>
          <PriceTicker value={estimatedTaxCents} inCents={true} className="text-text-money" />
        </m.div>

        {/* Divider */}
        <div className="h-px bg-border my-2" />

        {/* Estimated Total */}
        <m.div
          variants={shouldAnimate ? summaryRowVariants : undefined}
          initial={shouldAnimate ? "hidden" : undefined}
          animate={shouldAnimate ? "visible" : undefined}
          transition={{ delay: 0.15 }}
          className="flex justify-between items-center font-semibold text-base"
        >
          <span className="text-text-primary">Estimated Total</span>
          <PriceTicker
            value={estimatedTotal + estimatedTaxCents}
            inCents={true}
            size="lg"
            className="text-text-money font-bold"
          />
        </m.div>
      </div>
    </m.div>
  );
}

export default CartSummary;
