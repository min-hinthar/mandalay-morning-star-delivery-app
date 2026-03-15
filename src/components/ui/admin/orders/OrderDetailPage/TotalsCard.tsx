"use client";

import { Receipt } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/currency";
import { CollapsibleCard } from "./CollapsibleCard";
import type { OrderDetail } from "./types";

interface TotalsCardProps {
  order: OrderDetail;
}

export function TotalsCard({ order }: TotalsCardProps) {
  return (
    <CollapsibleCard title="Totals" icon={<Receipt className="h-4 w-4" />} defaultOpen>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Subtotal</span>
          <span className="text-text-primary">{formatPrice(order.subtotalCents)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Delivery Fee</span>
          <span className="text-text-primary">{formatPrice(order.deliveryFeeCents)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Tax</span>
          <span className="text-text-primary">{formatPrice(order.taxCents)}</span>
        </div>
        {order.tipCents > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Tip</span>
            <span className="text-text-primary">{formatPrice(order.tipCents)}</span>
          </div>
        )}
        {order.discountCents > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Discount</span>
            <span className="text-green font-medium">-{formatPrice(order.discountCents)}</span>
          </div>
        )}
        <div className={cn("flex items-center justify-between pt-2 border-t border-border")}>
          <span className="font-display font-bold text-text-primary text-base">Total</span>
          <span className="font-display font-bold text-text-primary text-lg">
            {formatPrice(order.totalCents)}
          </span>
        </div>
      </div>
    </CollapsibleCard>
  );
}
