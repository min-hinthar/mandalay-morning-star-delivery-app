"use client";

import { motion } from "framer-motion";
import { useCart } from "@/lib/hooks/useCart";
import { formatPrice } from "@/lib/utils/format";
import { ShoppingBag, Truck, Sparkles } from "lucide-react";

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
    <div className="sticky top-4 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-r from-primary/5 to-transparent px-5 py-4">
        <h3 className="flex items-center gap-2 font-bold text-foreground">
          <ShoppingBag className="h-5 w-5 text-primary" />
          Order Summary
        </h3>
      </div>

      {/* Items */}
      <ul className="max-h-64 space-y-3 overflow-y-auto px-5 py-4">
        {items.map((item, index) => {
          const itemTotal =
            (item.basePriceCents +
              item.modifiers.reduce((sum, m) => sum + m.priceDeltaCents, 0)) *
            item.quantity;

          return (
            <motion.li
              key={item.cartItemId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex justify-between text-sm"
            >
              <div className="flex-1 min-w-0 pr-3">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                    {item.quantity}
                  </span>
                  <span className="font-medium text-foreground truncate">{item.nameEn}</span>
                </div>
                {item.modifiers.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground truncate pl-6">
                    {item.modifiers.map((m) => m.optionName).join(", ")}
                  </p>
                )}
              </div>
              <span className="font-semibold text-foreground flex-shrink-0">
                {formatPrice(itemTotal)}
              </span>
            </motion.li>
          );
        })}
      </ul>

      {/* Totals */}
      <div className="border-t border-border bg-muted/20 px-5 py-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium text-foreground">{formattedSubtotal}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Delivery</span>
          <span className="font-medium text-foreground">
            {estimatedDeliveryFee === 0 ? (
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <Sparkles className="h-3.5 w-3.5" />
                FREE
              </span>
            ) : (
              formattedDeliveryFee
            )}
          </span>
        </div>

        {amountToFreeDelivery > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-50 to-amber-100/50 p-3 text-xs"
          >
            <Truck className="h-4 w-4 flex-shrink-0 text-amber-600" />
            <span className="text-amber-800">
              Add <span className="font-semibold">{formatPrice(amountToFreeDelivery)}</span> more for free delivery!
            </span>
          </motion.div>
        )}

        <div className="flex justify-between border-t border-border pt-3">
          <span className="text-base font-bold text-foreground">Estimated Total</span>
          <span className="text-lg font-bold text-primary">{formattedTotal}</span>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Tax calculated at checkout
        </p>
      </div>
    </div>
  );
}
