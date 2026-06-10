"use client";

import { memo } from "react";
import { m } from "framer-motion";
import { Receipt } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { PriceTicker } from "@/components/ui/PriceTicker";
import { HeroCardLayers } from "@/components/ui/homepage/Hero/HeroCardLayers";
import { HeroSunburst } from "@/components/ui/homepage/Hero/HeroSunburst";
import { useTilt } from "@/components/ui/homepage/Hero/interactions";
import { GoldLeaf } from "@/components/ui/GoldLeaf";
import { FreeDeliveryProgress } from "../FreeDeliveryProgress";
import { COVINA_TAX_RATE } from "@/lib/utils/order";

export interface CartPageSummaryProps {
  subtotalCents: number;
  deliveryFeeCents: number;
  minimumShortfallCents: number;
  amountToFreeDelivery: number;
  className?: string;
  isExtendedRange?: boolean;
}

const summaryRowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
};

/**
 * CartPageSummary — the /cart page's order summary, in warm-paper parity with
 * the drawer's living receipt (CartSummary): hero-surface-paper + HeroCardLayers
 * + GoldLeaf lacquer + gentle pointer tilt, constant hero-ink tokens (the card
 * is cream in both themes). Presentation only — totals math is unchanged.
 */
export const CartPageSummary = memo(function CartPageSummary({
  subtotalCents,
  deliveryFeeCents,
  minimumShortfallCents,
  amountToFreeDelivery,
  className,
  isExtendedRange = false,
}: CartPageSummaryProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  // Gentle tilt — no CTA in this card's body (menu-card gotcha), no preserve-3d.
  const tilt = useTilt(3);

  const estimatedTaxCents = Math.round(subtotalCents * COVINA_TAX_RATE);
  const totalCents = subtotalCents + deliveryFeeCents + estimatedTaxCents;

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: 16 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={getSpring(spring.gentle)}
      style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformPerspective: 900 }}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      className={cn("hero-surface-paper relative overflow-hidden rounded-2xl p-5", className)}
    >
      <HeroCardLayers accent="clay" radius="rounded-2xl" />
      <GoldLeaf radius="rounded-2xl" />

      <div className="relative">
        <FreeDeliveryProgress
          amountToFreeDelivery={amountToFreeDelivery}
          isExtendedRange={isExtendedRange}
          className="mb-4"
        />

        {/* Editorial header — mirrors the drawer receipt */}
        <div className="mb-4 flex items-center gap-2 text-hero-accent">
          <HeroSunburst className="h-4 w-4 shrink-0" rays={8} />
          <div className="leading-tight">
            <h2 className="font-display text-base font-bold text-hero-ink">Order Summary</h2>
            <span className="font-burmese text-2xs text-hero-ink-muted" lang="my">
              အော်ဒါ ချုပ်
            </span>
          </div>
        </div>

        <div className="space-y-2.5 text-sm">
          {/* Subtotal */}
          <m.div
            variants={shouldAnimate ? summaryRowVariants : undefined}
            initial={shouldAnimate ? "hidden" : undefined}
            animate={shouldAnimate ? "visible" : undefined}
            className="flex justify-between text-hero-ink-muted"
          >
            <span>Subtotal</span>
            <PriceTicker value={subtotalCents} inCents className="text-hero-ink" />
          </m.div>

          {/* Delivery Fee */}
          <m.div
            variants={shouldAnimate ? summaryRowVariants : undefined}
            initial={shouldAnimate ? "hidden" : undefined}
            animate={shouldAnimate ? "visible" : undefined}
            transition={{ delay: 0.05 }}
            className="flex justify-between text-hero-ink-muted"
          >
            <span>{isExtendedRange ? "Extended Delivery" : "Delivery Fee"}</span>
            {deliveryFeeCents === 0 ? (
              <span className="font-semibold text-hero-sage">FREE</span>
            ) : (
              <PriceTicker value={deliveryFeeCents} inCents className="text-hero-ink" />
            )}
          </m.div>

          {/* Estimated Tax */}
          <m.div
            variants={shouldAnimate ? summaryRowVariants : undefined}
            initial={shouldAnimate ? "hidden" : undefined}
            animate={shouldAnimate ? "visible" : undefined}
            transition={{ delay: 0.1 }}
            className="flex justify-between text-hero-ink-muted"
          >
            <span>Est. Tax</span>
            <PriceTicker value={estimatedTaxCents} inCents className="text-hero-ink" />
          </m.div>

          {/* Minimum order shortfall */}
          {minimumShortfallCents > 0 && (
            <m.div
              initial={shouldAnimate ? { opacity: 0, height: 0 } : undefined}
              animate={shouldAnimate ? { opacity: 1, height: "auto" } : undefined}
              transition={getSpring(spring.gentle)}
              className="flex justify-between pt-1 text-sm"
            >
              <span className="font-medium text-status-error">Below minimum</span>
              <span className="font-semibold text-status-error">
                ${(minimumShortfallCents / 100).toFixed(2)} short
              </span>
            </m.div>
          )}

          {/* Divider */}
          <div className="checkout-perf my-2" aria-hidden="true" />

          {/* Total */}
          <m.div
            variants={shouldAnimate ? summaryRowVariants : undefined}
            initial={shouldAnimate ? "hidden" : undefined}
            animate={shouldAnimate ? "visible" : undefined}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-between pt-1 text-base font-semibold"
          >
            <span className="flex items-center gap-1.5 text-hero-ink">
              <Receipt className="h-4 w-4 text-hero-accent" aria-hidden="true" />
              Estimated Total
            </span>
            <PriceTicker value={totalCents} inCents size="lg" className="font-bold text-hero-ink" />
          </m.div>
        </div>
      </div>
    </m.div>
  );
});
