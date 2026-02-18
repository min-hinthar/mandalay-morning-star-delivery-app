"use client";

import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/currency";
import { CollapsibleCard } from "./CollapsibleCard";
import type { OrderDetailItem } from "./types";

interface OrderItemsCardProps {
  items: OrderDetailItem[];
}

export function OrderItemsCard({ items }: OrderItemsCardProps) {
  return (
    <CollapsibleCard
      title={`Items (${items.length})`}
      icon={<ShoppingBag className="h-4 w-4" />}
      defaultOpen
    >
      <div className="space-y-2">
        {items.map((item) => {
          const isRefunded = item.refundedQuantity > 0;
          return (
            <div
              key={item.id}
              className={cn(
                "flex items-start justify-between gap-3 py-2",
                "border-b border-border-subtle last:border-0"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-medium text-text-primary",
                      isRefunded && "line-through text-text-muted"
                    )}
                  >
                    {item.name}
                  </span>
                  <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-surface-tertiary text-xs font-semibold text-text-secondary">
                    x{item.quantity}
                  </span>
                  {isRefunded && (
                    <span className="text-xs font-medium text-status-error">(Refunded)</span>
                  )}
                </div>
                {item.specialInstructions && (
                  <p className="text-xs text-text-muted mt-0.5 italic">
                    {item.specialInstructions}
                  </p>
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium text-text-primary flex-shrink-0",
                  isRefunded && "line-through text-text-muted"
                )}
              >
                {formatPrice(item.lineTotal)}
              </span>
            </div>
          );
        })}
      </div>
    </CollapsibleCard>
  );
}
