"use client";

import { couponEffect } from "@/lib/coupons/effect";
import { useCheckoutStore } from "@/lib/stores/checkout-store";

export interface PromoEffectPreview {
  /** Off the food subtotal. */
  discountCents: number;
  /** Off the delivery fee (free-delivery codes). */
  deliveryWaiverCents: number;
  /** Code applied but the cart is under its minimum — server will reject it. */
  shortfallCents: number;
  /** Free-delivery code on an order whose delivery is already free — the server leaves it unused. */
  idle: boolean;
}

/**
 * Live client estimate of the applied code, recomputed from the CURRENT cart
 * with the same pure math the server uses (`couponEffect`). Previously the
 * summary subtracted a frozen `discountCents` — 0 for every percent code
 * (the badge said "20% off" while the total ignored it) and never adjusted
 * when the cart dropped below the code's minimum.
 */
export function usePromoEffect(
  subtotalCents: number,
  deliveryFeeCents: number
): PromoEffectPreview {
  const applied = useCheckoutStore((s) => s.promoApplied);
  const kind = useCheckoutStore((s) => s.promoKind);
  const amountCents = useCheckoutStore((s) => s.discountCents);
  const percentOff = useCheckoutStore((s) => s.promoPercentOff);
  const maxDiscountCents = useCheckoutStore((s) => s.promoMaxDiscountCents);
  const minimumCents = useCheckoutStore((s) => s.promoMinSubtotalCents);

  const none = { discountCents: 0, deliveryWaiverCents: 0, shortfallCents: 0, idle: false };
  if (!applied) return none;
  if (minimumCents != null && subtotalCents < minimumCents) {
    return { ...none, shortfallCents: minimumCents - subtotalCents };
  }
  const effect = couponEffect(
    kind ?? "amount_off",
    {
      amount_off_cents: amountCents,
      percent_off: percentOff,
      max_discount_cents: maxDiscountCents,
    },
    subtotalCents,
    deliveryFeeCents
  );
  const idle = kind === "free_delivery" && effect.deliveryWaiverCents === 0;
  return { ...effect, shortfallCents: 0, idle };
}
