"use client";

import { memo } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { PriceTicker } from "@/components/ui/PriceTicker";
import { FreeDeliveryProgress } from "../FreeDeliveryProgress";

export interface CartPageSummaryProps {
  subtotalCents: number;
  deliveryFeeCents: number;
  minimumShortfallCents: number;
  amountToFreeDelivery: number;
  className?: string;
}

const TAX_RATE = 0.085; // 8.5% estimated tax

const summaryRowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
};

export const CartPageSummary = memo(function CartPageSummary({
  subtotalCents,
  deliveryFeeCents,
  minimumShortfallCents,
  amountToFreeDelivery,
  className,
}: CartPageSummaryProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  const estimatedTaxCents = Math.round(subtotalCents * TAX_RATE);
  const totalCents = subtotalCents + deliveryFeeCents + estimatedTaxCents;

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: 16 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={getSpring(spring.gentle)}
      className={cn(
        "rounded-2xl p-5",
        "glass-menu-card",
        "border border-surface-border/40",
        "shadow-colorful shadow-lg",
        className
      )}
    >
      <FreeDeliveryProgress
        amountToFreeDelivery={amountToFreeDelivery}
        className="mb-4"
      />

      <h2 className="text-base font-display font-bold text-text-primary mb-4">
        Order Summary
      </h2>

      <div className="space-y-2.5 text-sm">
        {/* Subtotal */}
        <m.div
          variants={shouldAnimate ? summaryRowVariants : undefined}
          initial={shouldAnimate ? "hidden" : undefined}
          animate={shouldAnimate ? "visible" : undefined}
          className="flex justify-between text-text-secondary"
        >
          <span>Subtotal</span>
          <PriceTicker
            value={subtotalCents}
            inCents
            className="text-text-money"
          />
        </m.div>

        {/* Delivery Fee */}
        <m.div
          variants={shouldAnimate ? summaryRowVariants : undefined}
          initial={shouldAnimate ? "hidden" : undefined}
          animate={shouldAnimate ? "visible" : undefined}
          transition={{ delay: 0.05 }}
          className="flex justify-between text-text-secondary"
        >
          <span>Delivery Fee</span>
          {deliveryFeeCents === 0 ? (
            <span className="text-text-money font-semibold">FREE</span>
          ) : (
            <PriceTicker
              value={deliveryFeeCents}
              inCents
              className="text-text-money"
            />
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
          <PriceTicker
            value={estimatedTaxCents}
            inCents
            className="text-text-money"
          />
        </m.div>

        {/* Minimum order shortfall */}
        {minimumShortfallCents > 0 && (
          <m.div
            initial={shouldAnimate ? { opacity: 0, height: 0 } : undefined}
            animate={shouldAnimate ? { opacity: 1, height: "auto" } : undefined}
            transition={getSpring(spring.gentle)}
            className="flex justify-between text-sm pt-1"
          >
            <span className="text-red-500 dark:text-red-400 font-medium">
              Below minimum
            </span>
            <span className="text-red-500 dark:text-red-400 font-semibold">
              ${(minimumShortfallCents / 100).toFixed(2)} short
            </span>
          </m.div>
        )}

        {/* Divider */}
        <div className="h-px bg-border my-2" />

        {/* Total */}
        <m.div
          variants={shouldAnimate ? summaryRowVariants : undefined}
          initial={shouldAnimate ? "hidden" : undefined}
          animate={shouldAnimate ? "visible" : undefined}
          transition={{ delay: 0.15 }}
          className="flex justify-between items-center font-semibold text-base pt-1"
        >
          <span className="text-text-primary">Estimated Total</span>
          <PriceTicker
            value={totalCents}
            inCents
            size="lg"
            className="text-text-money font-bold"
          />
        </m.div>
      </div>
    </m.div>
  );
});

export default CartPageSummary;
