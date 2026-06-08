"use client";

/**
 * CheckoutSummaryV8 — the "living receipt".
 *
 * Warm-paper ticket (After Dark): editorial header, item ledger with live
 * rolling prices, dashed perforation rules, a sage→clay free-delivery fill
 * that bursts on unlock, a big rolling total under a slow ledger sheen, and a
 * torn/punched bottom edge. Presentation only — every total computation is
 * unchanged from the prior summary.
 *
 * Guardrails honored: opaque cream surface (no mobile backdrop-filter), radial
 * glows via HeroCardLayers (no blur()), reduced-motion-safe, token-pure.
 */

import { m } from "framer-motion";
import { ShoppingBag, Truck, Sparkles, Tag, Receipt } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring, staggerItem, staggerContainer } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useCart } from "@/lib/hooks/useCart";
import { useCheckoutStore } from "@/lib/stores/checkout-store";
import { useCartStore } from "@/lib/stores/cart-store";
import { HeroCardLayers } from "@/components/ui/homepage/Hero/HeroCardLayers";
import { HeroSunburst } from "@/components/ui/homepage/Hero/HeroSunburst";
import { PriceTicker } from "@/components/ui/PriceTicker";
import { formatPrice } from "@/lib/utils/format";
import { COVINA_TAX_RATE } from "@/lib/utils/order";

export interface CheckoutSummaryV8Props {
  className?: string;
}

const TEAR_HEIGHT = "0.6875rem"; // matches .checkout-tear

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

  const addressDistanceMiles = useCartStore((s) => s.addressDistanceMiles);
  const longDistanceThresholdMiles = useCartStore((s) => s.longDistanceThresholdMiles);
  const isExtendedRange =
    addressDistanceMiles != null && addressDistanceMiles > longDistanceThresholdMiles;

  const tipPercent = useCheckoutStore((s) => s.tipPercent);
  const customTipCents = useCheckoutStore((s) => s.customTipCents);
  const discountCents = useCheckoutStore((s) => s.discountCents);
  const discountLabel = useCheckoutStore((s) => s.discountLabel);
  const promoApplied = useCheckoutStore((s) => s.promoApplied);

  // ---- Computations (unchanged) ----
  const tipCents =
    tipPercent !== null ? Math.round((itemsSubtotal * tipPercent) / 100) : customTipCents;
  const estimatedTaxCents = Math.round(itemsSubtotal * COVINA_TAX_RATE);
  const adjustedTotal = estimatedTotal + tipCents + estimatedTaxCents - discountCents;
  const progressPercent = Math.min(
    100,
    ((freeDeliveryThresholdCents - amountToFreeDelivery) / freeDeliveryThresholdCents) * 100
  );
  const hasFreeDelivery = amountToFreeDelivery <= 0 && !isExtendedRange;
  const itemCount = items.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <div className={cn("relative", className)}>
      {/* Bound-ledger spine — triad gradient bar down the receipt's left edge */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-3 bottom-5 z-10 w-[3px] rounded-full bg-gradient-to-b from-hero-clay via-hero-blue to-hero-sage opacity-70"
      />
      {/* Ticket body — opaque warm paper so the torn foot matches exactly */}
      <div className="hero-surface-paper relative overflow-hidden rounded-t-2xl">
        <HeroCardLayers accent="clay" radius="rounded-t-2xl" />

        <div className="relative">
          {/* Editorial header */}
          <div className="flex items-center justify-between border-b border-hero-line/70 px-5 py-4">
            <div className="flex items-center gap-2 text-hero-accent">
              <HeroSunburst className="h-4 w-4" rays={8} />
              <div className="leading-tight">
                <h3 className="font-display text-base font-semibold text-hero-ink">Your order</h3>
                <span className="font-burmese text-2xs text-hero-ink-muted" lang="my">
                  အော်ဒါ
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-hero-line bg-hero-card/70 px-2.5 py-1 text-2xs font-bold text-hero-ink-muted">
              <ShoppingBag className="h-3.5 w-3.5 text-hero-clay" aria-hidden="true" />
              {itemCount} {itemCount === 1 ? "item" : "items"}
              <span className="font-burmese" lang="my">
                · {itemCount} ခု
              </span>
            </span>
          </div>

          {/* Item ledger */}
          <m.ul
            variants={shouldAnimate ? staggerContainer(0.05, 0.08) : undefined}
            initial={shouldAnimate ? "hidden" : undefined}
            animate={shouldAnimate ? "visible" : undefined}
            className="max-h-64 space-y-3 overflow-y-auto px-5 py-4"
          >
            {items.map((item) => {
              const itemTotal =
                (item.basePriceCents +
                  item.modifiers.reduce((sum, m) => sum + m.priceDeltaCents, 0)) *
                item.quantity;

              return (
                <m.li
                  key={item.cartItemId}
                  variants={shouldAnimate ? staggerItem : undefined}
                  className="-mx-2 flex justify-between rounded-lg px-2 py-0.5 text-sm transition-colors hover:bg-hero-clay/[0.07]"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-1.5">
                      <m.span
                        className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-hero-clay/12 text-xs font-bold text-hero-accent"
                        initial={shouldAnimate ? { scale: 0 } : undefined}
                        animate={shouldAnimate ? { scale: 1 } : undefined}
                        transition={getSpring(spring.ultraBouncy)}
                      >
                        {item.quantity}
                      </m.span>
                      <span className="truncate font-medium text-hero-ink">{item.nameEn}</span>
                    </div>
                    {item.modifiers.length > 0 && (
                      <p className="mt-1 truncate pl-6 text-xs text-hero-ink-muted">
                        {item.modifiers.map((mod) => mod.optionName).join(", ")}
                      </p>
                    )}
                  </div>
                  <PriceTicker
                    value={itemTotal}
                    inCents
                    size="sm"
                    className="flex-shrink-0 font-semibold text-hero-ink"
                  />
                </m.li>
              );
            })}
          </m.ul>

          {/* Totals — on a perforated ledger */}
          <div className="space-y-3 px-5 pb-5 pt-4">
            <div className="checkout-perf -mx-5 mb-1" aria-hidden="true" />

            {/* Extended range notice */}
            {isExtendedRange && (
              <FadeRow shouldAnimate={shouldAnimate} getSpring={getSpring}>
                <div className="rounded-xl border border-hero-blue/25 bg-hero-blue/10 p-3">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-hero-blue" aria-hidden="true" />
                    <span className="text-sm font-semibold text-hero-ink">
                      Extended delivery: ${(estimatedDeliveryFee / 100).toFixed(2)} flat fee
                    </span>
                  </div>
                  {addressDistanceMiles != null && (
                    <p className="ml-6 mt-1 text-xs text-hero-ink-muted">
                      {addressDistanceMiles.toFixed(1)} mi from kitchen
                    </p>
                  )}
                </div>
              </FadeRow>
            )}

            {/* Free delivery progress */}
            {!hasFreeDelivery && !isExtendedRange && (
              <FadeRow shouldAnimate={shouldAnimate} getSpring={getSpring}>
                <div className="rounded-xl border border-hero-clay/25 bg-hero-clay/10 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <m.span
                      animate={
                        shouldAnimate
                          ? { rotate: [0, 14, -14, 0], scale: [1, 1.12, 1.12, 1] }
                          : undefined
                      }
                      transition={{ duration: 0.6, repeat: 4, repeatDelay: 2.5 }}
                    >
                      <Sparkles className="h-4 w-4 text-hero-clay" aria-hidden="true" />
                    </m.span>
                    <span className="text-sm font-semibold text-hero-ink">
                      {formatPrice(amountToFreeDelivery)} more for free delivery
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-hero-ink/10">
                    <m.div
                      className="checkout-progress-fill h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={getSpring(spring.rubbery)}
                    />
                  </div>
                </div>
              </FadeRow>
            )}

            {/* Free delivery achieved */}
            {hasFreeDelivery && !isExtendedRange && (
              <m.div
                initial={shouldAnimate ? { opacity: 0, scale: 0.92 } : undefined}
                animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
                transition={getSpring(spring.ultraBouncy)}
                className="rounded-xl border border-hero-sage/30 bg-hero-sage/10 p-3"
              >
                <div className="flex items-center gap-2">
                  <m.span
                    animate={shouldAnimate ? { scale: [1, 1.2, 1] } : undefined}
                    transition={{ duration: 0.5, repeat: 4, repeatDelay: 3 }}
                  >
                    <Sparkles className="h-4 w-4 text-hero-sage" aria-hidden="true" />
                  </m.span>
                  <span className="text-sm font-semibold text-hero-ink">
                    You qualify for free delivery
                  </span>
                </div>
              </m.div>
            )}

            <LedgerRow label="Subtotal" shouldAnimate={shouldAnimate}>
              <PriceTicker value={itemsSubtotal} inCents size="sm" className="text-hero-ink" />
            </LedgerRow>

            <LedgerRow
              shouldAnimate={shouldAnimate}
              delay={0.05}
              label={
                <span className="flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5" aria-hidden="true" />
                  {isExtendedRange ? "Extended Delivery" : "Delivery"}
                </span>
              }
            >
              {hasFreeDelivery ? (
                <m.span
                  initial={shouldAnimate ? { scale: 0.8, opacity: 0 } : undefined}
                  animate={shouldAnimate ? { scale: 1, opacity: 1 } : undefined}
                  transition={getSpring(spring.ultraBouncy)}
                  className="flex items-center gap-1 font-bold text-hero-sage"
                >
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
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
              delay={0.07}
              label={
                <span className="flex items-center gap-1.5">
                  <Receipt className="h-3.5 w-3.5" aria-hidden="true" />
                  Tax (10.5%)
                </span>
              }
            >
              <PriceTicker value={estimatedTaxCents} inCents size="sm" className="text-hero-ink" />
            </LedgerRow>

            {tipCents > 0 && (
              <LedgerRow label="Tip" shouldAnimate={shouldAnimate} delay={0.1}>
                <PriceTicker value={tipCents} inCents size="sm" className="text-hero-ink" />
              </LedgerRow>
            )}

            {promoApplied && discountCents > 0 && (
              <m.div
                initial={shouldAnimate ? { opacity: 0, x: -10 } : undefined}
                animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
                transition={{ delay: 0.12 }}
                className="flex justify-between text-sm"
              >
                <span className="flex items-center gap-1.5 text-hero-sage">
                  <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                  {discountLabel}
                </span>
                <span className="font-semibold text-hero-sage">-{formatPrice(discountCents)}</span>
              </m.div>
            )}

            <div className="checkout-perf -mx-5 my-1" aria-hidden="true" />

            {/* Total — big rolling number under a slow ledger sheen */}
            <div className="relative overflow-hidden rounded-xl px-3 py-2.5">
              <span
                aria-hidden="true"
                className="checkout-total-sheen pointer-events-none absolute inset-0 rounded-xl"
              />
              <div className="relative flex items-center justify-between">
                <span className="font-display text-base font-semibold text-hero-ink">
                  Estimated total
                </span>
                <span aria-live="polite">
                  <PriceTicker
                    value={adjustedTotal}
                    inCents
                    size="lg"
                    className="font-bold text-hero-accent"
                  />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Torn/punched bottom edge */}
      <div className="checkout-tear" style={{ height: TEAR_HEIGHT }} aria-hidden="true" />
    </div>
  );
}

/** A ledger row: muted label left, value right; subtle slide-in. */
function LedgerRow({
  label,
  children,
  shouldAnimate,
  delay = 0,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
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
      <span>{label}</span>
      {children}
    </m.div>
  );
}

/** A gentle fade/rise wrapper for the delivery-status callouts. */
function FadeRow({
  children,
  shouldAnimate,
  getSpring,
}: {
  children: React.ReactNode;
  shouldAnimate: boolean;
  getSpring: ReturnType<typeof useAnimationPreference>["getSpring"];
}) {
  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={getSpring(spring.gentle)}
    >
      {children}
    </m.div>
  );
}

export default CheckoutSummaryV8;
