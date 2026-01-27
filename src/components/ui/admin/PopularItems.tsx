"use client";

import { cn } from "@/lib/utils/cn";

/**
 * V6 Popular Items List - Pepper Aesthetic
 *
 * Displays top selling items with rank badges
 */

interface PopularItem {
  name: string;
  quantity: number;
  revenue: number;
}

interface PopularItemsProps {
  items: PopularItem[];
}

export function PopularItems({ items }: PopularItemsProps) {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  if (items.length === 0) {
    return (
      <p className="text-sm font-body text-text-muted">
        No order data available
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={item.name}
          className={cn(
            "flex items-center justify-between",
            "p-3 rounded-input",
            "bg-surface-secondary",
            "transition-colors duration-fast",
            "hover:bg-surface-tertiary"
          )}
        >
          <div className="flex items-center gap-3">
            {/* V6 Rank Badge */}
            <div
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-full",
                "text-xs font-display font-bold",
                index === 0 && "bg-secondary text-text-primary",
                index === 1 && "bg-primary/10 text-primary",
                index === 2 && "bg-accent-orange/10 text-accent-orange",
                index > 2 && "bg-surface-tertiary text-text-muted"
              )}
            >
              {index + 1}
            </div>
            <span className="text-sm font-body font-medium text-text-primary">
              {item.name}
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm font-body font-semibold text-text-primary">
              {item.quantity} sold
            </p>
            <p className="text-xs font-body text-text-muted">
              {formatCurrency(item.revenue)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
