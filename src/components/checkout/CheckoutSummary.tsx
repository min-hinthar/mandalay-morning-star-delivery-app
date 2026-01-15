"use client";

import { useCart } from "@/lib/hooks/useCart";
import { formatPrice } from "@/lib/utils/format";
import { Truck } from "lucide-react";

export function CheckoutSummary() {
  const {
    items,
    estimatedDeliveryFee,
    formattedSubtotal,
    formattedDeliveryFee,
    formattedTotal,
    amountToFreeDelivery,
  } = useCart();

  return (
    <div className="sticky top-4 rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="mb-4 font-semibold text-foreground">Order Summary</h3>

      <ul className="max-h-64 space-y-3 overflow-y-auto border-b border-border pb-4">
        {items.map((item) => {
          const itemTotal =
            (item.basePriceCents +
              item.modifiers.reduce((sum, m) => sum + m.priceDeltaCents, 0)) *
            item.quantity;

          return (
            <li key={item.cartItemId} className="flex justify-between text-sm">
              <div className="flex-1 min-w-0 pr-2">
                <div>
                  <span className="font-medium text-foreground">
                    {item.quantity}×
                  </span>{" "}
                  <span className="text-foreground">{item.nameEn}</span>
                </div>
                {item.modifiers.length > 0 && (
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">
                    {item.modifiers.map((m) => m.optionName).join(", ")}
                  </p>
                )}
              </div>
              <span className="font-medium text-foreground flex-shrink-0">
                {formatPrice(itemTotal)}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="space-y-2 pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-foreground">{formattedSubtotal}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Delivery</span>
          <span className="text-foreground">
            {estimatedDeliveryFee === 0 ? (
              <span className="text-emerald-600">FREE</span>
            ) : (
              formattedDeliveryFee
            )}
          </span>
        </div>

        {amountToFreeDelivery > 0 && (
          <div className="flex items-center gap-2 rounded-md bg-amber-50 p-2 text-xs text-amber-800">
            <Truck className="h-4 w-4 flex-shrink-0" />
            <span>
              Add {formatPrice(amountToFreeDelivery)} more for free delivery!
            </span>
          </div>
        )}

        <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
          <span className="text-foreground">Estimated Total</span>
          <span className="text-foreground">{formattedTotal}</span>
        </div>

        <p className="text-xs text-muted-foreground text-center pt-2">
          Tax calculated at checkout
        </p>
      </div>
    </div>
  );
}
