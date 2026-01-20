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
      <p className="text-sm font-v6-body text-v6-text-muted">
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
            "p-3 rounded-v6-input",
            "bg-v6-surface-secondary",
            "transition-colors duration-v6-fast",
            "hover:bg-v6-surface-tertiary"
          )}
        >
          <div className="flex items-center gap-3">
            {/* V6 Rank Badge */}
            <div
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-full",
                "text-xs font-v6-display font-bold",
                index === 0 && "bg-v6-secondary text-v6-text-primary",
                index === 1 && "bg-v6-primary/10 text-v6-primary",
                index === 2 && "bg-v6-accent-orange/10 text-v6-accent-orange",
                index > 2 && "bg-v6-surface-tertiary text-v6-text-muted"
              )}
            >
              {index + 1}
            </div>
            <span className="text-sm font-v6-body font-medium text-v6-text-primary">
              {item.name}
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm font-v6-body font-semibold text-v6-text-primary">
              {item.quantity} sold
            </p>
            <p className="text-xs font-v6-body text-v6-text-muted">
              {formatCurrency(item.revenue)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
