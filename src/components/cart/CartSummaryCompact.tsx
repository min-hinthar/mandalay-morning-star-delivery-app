"use client";

import { useCart } from "@/lib/hooks/useCart";
import { cn } from "@/lib/utils/cn";

interface CartSummaryCompactProps {
  className?: string;
}

export function CartSummaryCompact({ className }: CartSummaryCompactProps) {
  const { formattedSubtotal, itemCount, amountToFreeDelivery } = useCart();

  if (itemCount === 0) return null;

  return (
    <div className={cn("text-sm", className)}>
      <span className="font-medium">{formattedSubtotal}</span>
      {amountToFreeDelivery > 0 && (
        <span className="ml-2 text-xs text-muted-foreground">
          (${(amountToFreeDelivery / 100).toFixed(0)} to free delivery)
        </span>
      )}
    </div>
  );
}
