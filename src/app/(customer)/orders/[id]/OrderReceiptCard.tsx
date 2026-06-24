"use client";

/**
 * OrderReceiptCard — the order-detail "living receipt" card.
 *
 * Extracted as a client sibling so the kit tactile pass (gentle pointer tilt +
 * gold-leaf lacquer sheen) can wrap the items ledger. No CTA inside the body and
 * no preserve-3d, so tilt is safe here (menu-card gotcha respected). Presentation
 * only — every total computation is unchanged.
 */

import { m } from "framer-motion";
import { Package } from "lucide-react";
import { HeroCardLayers } from "@/components/ui/homepage/Hero/HeroCardLayers";
import { useTilt } from "@/components/ui/homepage/Hero/interactions";
import { GoldLeaf } from "@/components/ui/GoldLeaf";
import { formatPrice } from "@/lib/utils/currency";
import { receiptDisplayDiscountCents } from "@/lib/utils/order";
import type { Order, OrderItem } from "@/types/order";

interface OrderReceiptCardProps {
  order: Order;
  items: OrderItem[];
}

export function OrderReceiptCard({ order, items }: OrderReceiptCardProps) {
  const tilt = useTilt(3);
  // Shared clamp so the rows reconcile to the floored-at-$0 stored total.
  const displayDiscountCents = receiptDisplayDiscountCents(order);

  return (
    <m.div
      className="hero-surface-paper relative overflow-hidden rounded-2xl"
      style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformPerspective: 900 }}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
    >
      <HeroCardLayers accent="sage" radius="rounded-2xl" />
      {/* Gold-leaf flecks + lacquer sheen (kit) */}
      <GoldLeaf radius="rounded-2xl" />
      <div className="relative">
        <div className="flex items-center gap-2 border-b border-hero-line/70 p-4">
          <Package className="h-5 w-5 text-hero-sage" aria-hidden="true" />
          <span className="font-display font-semibold text-hero-ink">
            Order items
            <span
              className="ml-1.5 font-burmese text-2xs font-normal text-hero-ink-muted"
              lang="my"
            >
              ပစ္စည်းများ
            </span>
          </span>
        </div>
        <div className="space-y-4 p-5">
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <span className="font-medium text-hero-ink">
                    {item.quantity}× {item.nameSnapshot}
                  </span>
                  {item.modifiers.length > 0 && (
                    <span className="ml-1 text-hero-ink-muted">
                      ({item.modifiers.map((mod) => mod.nameSnapshot).join(", ")})
                    </span>
                  )}
                  {item.specialInstructions && (
                    <p className="mt-1 text-xs italic text-hero-ink-muted">
                      Note: {item.specialInstructions}
                    </p>
                  )}
                </div>
                <span className="shrink-0 font-semibold text-hero-ink">
                  {formatPrice(item.lineTotalCents)}
                </span>
              </li>
            ))}
          </ul>

          {order.specialInstructions && (
            <div className="border-t border-hero-line/60 pt-4">
              <p className="mb-1 text-sm font-medium text-hero-ink">Special instructions</p>
              <p className="text-sm text-hero-ink-muted">{order.specialInstructions}</p>
            </div>
          )}

          {/* Totals */}
          <div className="checkout-perf checkout-rule-draw" aria-hidden="true" />
          <div className="space-y-2 pt-1 text-sm">
            <div className="flex justify-between text-hero-ink-muted">
              <span>Subtotal</span>
              <span className="text-hero-ink">{formatPrice(order.subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-hero-ink-muted">
              <span>Delivery fee</span>
              {order.deliveryFeeCents === 0 ? (
                <span className="font-semibold text-hero-sage">FREE</span>
              ) : (
                <span className="text-hero-ink">{formatPrice(order.deliveryFeeCents)}</span>
              )}
            </div>
            {order.taxCents > 0 && (
              <div className="flex justify-between text-hero-ink-muted">
                <span>Tax</span>
                <span className="text-hero-ink">{formatPrice(order.taxCents)}</span>
              </div>
            )}
            {displayDiscountCents > 0 && (
              <div className="flex justify-between text-hero-ink-muted">
                <span>Discount{order.promoCode ? ` (${order.promoCode})` : ""}</span>
                <span className="font-semibold text-hero-sage">
                  −{formatPrice(displayDiscountCents)}
                </span>
              </div>
            )}
            {order.tipCents > 0 && (
              <div className="flex justify-between text-hero-ink-muted">
                <span>Tip</span>
                <span className="text-hero-ink">{formatPrice(order.tipCents)}</span>
              </div>
            )}
            <div className="checkout-perf checkout-rule-draw my-1" aria-hidden="true" />
            <div className="flex items-center justify-between pt-0.5 text-lg font-medium">
              <span className="font-display text-hero-ink">Total</span>
              <span className="font-bold text-hero-accent">{formatPrice(order.totalCents)}</span>
            </div>
          </div>
        </div>
      </div>
    </m.div>
  );
}

export default OrderReceiptCard;
