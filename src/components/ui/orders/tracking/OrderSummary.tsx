/**
 * Order Summary — After Dark living-receipt for the tracking screen.
 *
 * Warm-paper ledger mirroring CheckoutSummaryV8 / the cart: editorial bilingual
 * header, delivery info, full item list, draw-on perforation rules + rolling
 * totals. Presentation only — totals are passed in, unchanged.
 */

"use client";

import { Package, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { TrackingOrderItem } from "@/types/tracking";
import { formatPrice } from "@/lib/utils/currency";
import { receiptDisplayDiscountCents } from "@/lib/utils/order";
import { format, parseISO } from "date-fns";
import { PriceTicker } from "@/components/ui/PriceTicker";
import { HeroCardLayers } from "@/components/ui/homepage/Hero/HeroCardLayers";

interface OrderSummaryProps {
  items: TrackingOrderItem[];
  subtotalCents: number;
  deliveryFeeCents: number;
  taxCents: number;
  tipCents: number;
  discountCents: number;
  totalCents: number;
  deliveryWindow: {
    start: string | null;
    end: string | null;
  };
  deliveryAddress?: {
    line1: string;
    city: string;
    state: string;
  };
  className?: string;
}

export function OrderSummary({
  items,
  subtotalCents,
  deliveryFeeCents,
  taxCents,
  tipCents,
  discountCents,
  totalCents,
  deliveryWindow,
  deliveryAddress,
  className,
}: OrderSummaryProps) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Shared clamp so the rows reconcile to the floored-at-$0 stored total.
  const displayDiscountCents = receiptDisplayDiscountCents({
    subtotalCents,
    deliveryFeeCents,
    taxCents,
    tipCents,
    discountCents,
  });

  let deliveryWindowText = "";
  if (deliveryWindow.start && deliveryWindow.end) {
    const startTime = format(parseISO(deliveryWindow.start), "h:mm a");
    const endTime = format(parseISO(deliveryWindow.end), "h:mm a");
    const date = format(parseISO(deliveryWindow.start), "EEEE, MMM d");
    deliveryWindowText = `${date} • ${startTime} - ${endTime}`;
  }

  return (
    <div className={cn("hero-surface-paper relative overflow-hidden rounded-2xl", className)}>
      <HeroCardLayers accent="sage" radius="rounded-2xl" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-hero-line/70 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-hero-sage/12">
            <Package className="h-5 w-5 text-hero-sage" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <p className="font-display font-semibold text-hero-ink">
              Order details
              <span
                className="ml-1.5 font-burmese text-2xs font-normal text-hero-ink-muted"
                lang="my"
              >
                အော်ဒါ
              </span>
            </p>
            <p className="text-sm text-hero-ink-muted">
              {itemCount} {itemCount === 1 ? "item" : "items"} &bull; {formatPrice(totalCents)}
            </p>
          </div>
        </div>

        <div className="p-4">
          {/* Delivery Info */}
          {(deliveryWindowText || deliveryAddress) && (
            <div className="mb-4 space-y-2 border-b border-hero-line/60 pb-4">
              {deliveryWindowText && (
                <div className="flex items-start gap-2 text-sm">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-hero-clay" aria-hidden="true" />
                  <span className="text-hero-ink-muted">{deliveryWindowText}</span>
                </div>
              )}
              {deliveryAddress && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-hero-blue" aria-hidden="true" />
                  <span className="text-hero-ink-muted">
                    {deliveryAddress.line1}, {deliveryAddress.city}, {deliveryAddress.state}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Item list */}
          <ul className="space-y-2.5">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-sm">
                <span className="mt-px inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-md bg-hero-clay/12 px-1 text-xs font-bold text-hero-accent">
                  {item.quantity}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-hero-ink">{item.name}</p>
                  {item.modifiers.length > 0 && (
                    <p className="truncate text-xs text-hero-ink-muted">
                      {item.modifiers.join(", ")}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* Totals */}
          <div className="checkout-perf checkout-rule-draw mt-4" aria-hidden="true" />
          <div className="space-y-2 pt-3 text-sm">
            <div className="flex justify-between text-hero-ink-muted">
              <span>Subtotal</span>
              <PriceTicker value={subtotalCents} inCents size="sm" className="text-hero-ink" />
            </div>
            {displayDiscountCents > 0 && (
              <div className="flex justify-between text-hero-ink-muted">
                <span>Discount</span>
                <span className="font-semibold text-hero-sage">
                  −{formatPrice(displayDiscountCents)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-hero-ink-muted">
              <span>Delivery</span>
              {deliveryFeeCents === 0 ? (
                <span className="font-bold text-hero-sage">FREE</span>
              ) : (
                <PriceTicker value={deliveryFeeCents} inCents size="sm" className="text-hero-ink" />
              )}
            </div>
            <div className="flex justify-between text-hero-ink-muted">
              <span>Tax</span>
              <PriceTicker value={taxCents} inCents size="sm" className="text-hero-ink" />
            </div>
            {tipCents > 0 && (
              <div className="flex justify-between text-hero-ink-muted">
                <span>Tip</span>
                <PriceTicker value={tipCents} inCents size="sm" className="text-hero-ink" />
              </div>
            )}
            <div className="checkout-perf checkout-rule-draw my-1" aria-hidden="true" />
            <div className="flex items-center justify-between pt-0.5">
              <span className="font-display text-base font-semibold text-hero-ink">Total</span>
              <PriceTicker
                value={totalCents}
                inCents
                size="lg"
                className="font-bold text-hero-accent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
