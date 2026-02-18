/**
 * V2 Sprint 3: Order Summary Component
 *
 * Full item list visible by default (not collapsed).
 * Shows items, modifiers, delivery info, and totals.
 */

"use client";

import { Package, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { TrackingOrderItem } from "@/types/tracking";
import { formatPrice } from "@/lib/utils/currency";
import { format, parseISO } from "date-fns";

interface OrderSummaryProps {
  items: TrackingOrderItem[];
  subtotalCents: number;
  deliveryFeeCents: number;
  taxCents: number;
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
  totalCents,
  deliveryWindow,
  deliveryAddress,
  className,
}: OrderSummaryProps) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Format delivery window
  let deliveryWindowText = "";
  if (deliveryWindow.start && deliveryWindow.end) {
    const startTime = format(parseISO(deliveryWindow.start), "h:mm a");
    const endTime = format(parseISO(deliveryWindow.end), "h:mm a");
    const date = format(parseISO(deliveryWindow.start), "EEEE, MMM d");
    deliveryWindowText = `${date} \u2022 ${startTime} - ${endTime}`;
  }

  return (
    <div className={cn("rounded-xl bg-surface-primary shadow-warm-sm overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-saffron-100">
          <Package className="h-5 w-5 text-saffron-600" />
        </div>
        <div>
          <p className="font-semibold text-charcoal">Order Details</p>
          <p className="text-sm text-charcoal-500">
            {itemCount} {itemCount === 1 ? "item" : "items"} \u2022 {formatPrice(totalCents)}
          </p>
        </div>
      </div>

      {/* Content - always visible */}
      <div className="px-4 py-4">
        {/* Delivery Info */}
        <div className="space-y-2 mb-4 pb-4 border-b border-charcoal-100">
          {deliveryWindowText && (
            <div className="flex items-start gap-2 text-sm">
              <Clock className="h-4 w-4 text-charcoal-400 mt-0.5" />
              <span className="text-charcoal-600">{deliveryWindowText}</span>
            </div>
          )}
          {deliveryAddress && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-charcoal-400 mt-0.5" />
              <span className="text-charcoal-600">
                {deliveryAddress.line1}, {deliveryAddress.city}, {deliveryAddress.state}
              </span>
            </div>
          )}
        </div>

        {/* Item List - fully visible */}
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-charcoal">
                  {item.quantity}&times; {item.name}
                </p>
                {item.modifiers.length > 0 && (
                  <p className="text-sm text-charcoal-500 truncate">{item.modifiers.join(", ")}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-4 pt-4 border-t border-charcoal-100 space-y-2">
          <div className="flex justify-between text-sm text-charcoal-600">
            <span>Subtotal</span>
            <span>{formatPrice(subtotalCents)}</span>
          </div>
          <div className="flex justify-between text-sm text-charcoal-600">
            <span>Delivery Fee</span>
            <span>{deliveryFeeCents === 0 ? "FREE" : formatPrice(deliveryFeeCents)}</span>
          </div>
          <div className="flex justify-between text-sm text-charcoal-600">
            <span>Tax</span>
            <span>{formatPrice(taxCents)}</span>
          </div>
          <div className="flex justify-between font-semibold text-charcoal pt-2 border-t border-charcoal-100">
            <span>Total</span>
            <span>{formatPrice(totalCents)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
