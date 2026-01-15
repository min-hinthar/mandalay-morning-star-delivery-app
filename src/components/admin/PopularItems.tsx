"use client";

import { Badge } from "@/components/ui/badge";

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
      <p className="text-sm text-muted-foreground">No order data available</p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.name} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="w-6 h-6 flex items-center justify-center rounded-full text-xs"
            >
              {index + 1}
            </Badge>
            <span className="text-sm font-medium">{item.name}</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{item.quantity} sold</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(item.revenue)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
