"use client";

/**
 * CartSummary — the cart's "living ledger" (prelude to the checkout receipt).
 *
 * After Dark: the Morning-Star free-delivery journey on top, then a warm-paper
 * ledger with draw-on perforation rules, rolling prices, and a big rolling
 * total under a slow ledger sheen — the same vocabulary the checkout receipt
 * (CheckoutSummaryV8) uses, so cart → checkout reads as one continuous ticket.
 *
 * Presentation only: every total computation is unchanged.
 */

import type { ReactNode } from "react";
import { m } from "framer-motion";
import { Truck, Receipt } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useCart } from "@/lib/hooks/useCart";
import { COVINA_TAX_RATE } from "@/lib/utils/order";
import { useCartStore } from "@/lib/stores/cart-store";
import { PriceTicker } from "@/components/ui/PriceTicker";
import { HeroCardLayers } from "@/components/ui/homepage/Hero/HeroCardLayers";
import { useTilt } from "@/components/ui/homepage/Hero/interactions";
import { GoldLeaf } from "@/components/ui/GoldLeaf";
import { FreeDeliveryProgress } from "./FreeDeliveryProgress";

// ============================================
// TYPES
// ============================================

export interface CartSummaryProps {
  /** Additional className */
  className?: string;
}

/** A ledger row — muted label left, value right; gentle slide-in. */
function LedgerRow({
  label,
  children,
  shouldAnimate,
  delay = 0,
}: {
  label: ReactNode;
  children: ReactNode;
  shouldAnimate: boolean;
  delay?: number;
}) {
  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, x: -10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
      transition={{ delay, type: "spring", stiffness: 300, damping: 25 }}
      className="flex justify-between text-sm text-hero-ink-muted"
    >
      <span className="flex items-center gap-1.5">{label}</span>
      {children}
    </m.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CartSummary({ className }: CartSummaryProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const tilt = useTilt(3);
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
      className={cn("hero-surface-paper relative overflow-hidden rounded-2xl p-4", className)}
      // Gentle pointer tilt (kit tactile pass) — no CTA inside the receipt body,
      // no preserve-3d (menu-card + shadow-artifact gotchas respected)
      style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformPerspective: 900 }}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
    >
      <HeroCardLayers accent="clay" radius="rounded-2xl" />
      {/* Gold-leaf flecks + lacquer sheen (kit) */}
      <GoldLeaf radius="rounded-2xl" />
      <div className="relative space-y-3">
        {/* Morning-Star free-delivery journey */}
        <FreeDeliveryProgress
          amountToFreeDelivery={amountToFreeDelivery}
          isExtendedRange={isExtendedRange}
        />

        {/* Ledger */}
        <div className="checkout-perf checkout-rule-draw" aria-hidden="true" />

        <div className="space-y-2">
          <LedgerRow label="Subtotal" shouldAnimate={shouldAnimate}>
            <PriceTicker value={itemsSubtotal} inCents size="sm" className="text-hero-ink" />
          </LedgerRow>

          <LedgerRow
            shouldAnimate={shouldAnimate}
            delay={0.05}
            label={
              <>
                <Truck className="h-3.5 w-3.5" aria-hidden="true" />
                {isExtendedRange ? "Extended Delivery" : "Delivery Fee"}
              </>
            }
          >
            {hasFreeDelivery ? (
              <m.span
                initial={shouldAnimate ? { scale: 0.8, opacity: 0 } : undefined}
                animate={shouldAnimate ? { scale: 1, opacity: 1 } : undefined}
                transition={getSpring(spring.ultraBouncy)}
                className="font-bold text-hero-sage"
              >
                FREE
              </m.span>
            ) : (
              <PriceTicker
                value={estimatedDeliveryFee}
                inCents
                size="sm"
                className="text-hero-ink"
              />
            )}
          </LedgerRow>

          <LedgerRow
            shouldAnimate={shouldAnimate}
            delay={0.1}
            label={
              <>
                <Receipt className="h-3.5 w-3.5" aria-hidden="true" />
                Est. Tax
              </>
            }
          >
            <PriceTicker value={estimatedTaxCents} inCents size="sm" className="text-hero-ink" />
          </LedgerRow>
        </div>

        <div className="checkout-perf checkout-rule-draw" aria-hidden="true" />

        {/* Estimated total — big rolling number under a slow ledger sheen */}
        <div className="relative overflow-hidden rounded-xl px-3 py-2">
          <span
            aria-hidden="true"
            className="checkout-total-sheen pointer-events-none absolute inset-0 rounded-xl"
          />
          <div className="relative flex items-center justify-between">
            <span className="leading-tight">
              <span className="block font-display text-base font-semibold text-hero-ink">
                Estimated total
              </span>
              <span className="font-burmese text-2xs text-hero-ink-muted" lang="my">
                ခန့်မှန်းစုစုပေါင်း
              </span>
            </span>
            <span aria-live="polite">
              <PriceTicker
                value={estimatedTotal + estimatedTaxCents}
                inCents
                size="lg"
                className="font-bold text-hero-accent"
              />
            </span>
          </div>
        </div>
      </div>
    </m.div>
  );
}

export default CartSummary;
