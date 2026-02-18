"use client";

import { Loader2, Package, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import type { Order } from "./types";

interface OrderSelectionListProps {
  orders: Order[];
  selectedOrderIds: string[];
  loadingOrders: boolean;
  isSubmitting: boolean;
  error?: string;
  onToggle: (orderId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function OrderSelectionList({
  orders,
  selectedOrderIds,
  loadingOrders,
  isSubmitting,
  error,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: OrderSelectionListProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
          <Package className="h-4 w-4 text-interactive-primary" />
          Select Orders <span className="text-status-error">*</span>
        </label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSelectAll}
            disabled={orders.length === 0 || isSubmitting}
            className="text-xs h-7"
          >
            Select All
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDeselectAll}
            disabled={selectedOrderIds.length === 0 || isSubmitting}
            className="text-xs h-7"
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="max-h-48 overflow-y-auto rounded-lg border border-border-v5 bg-surface-primary">
        {loadingOrders ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-interactive-primary" />
          </div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No confirmed orders available for routing
          </p>
        ) : (
          <div className="divide-y divide-border-v5/50">
            {orders.map((order) => {
              const isSelected = selectedOrderIds.includes(order.id);

              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => onToggle(order.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 text-left transition-colors",
                    isSelected ? "bg-interactive-primary-light" : "hover:bg-surface-secondary"
                  )}
                  disabled={isSubmitting}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-5 w-5 rounded border-2 flex items-center justify-center transition-all",
                        isSelected
                          ? "bg-interactive-primary border-interactive-primary"
                          : "border-border-v5"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 text-text-inverse" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {order.customerName || "Guest"} • {order.itemCount} items
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-accent-tertiary">
                    ${(order.totalCents / 100).toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {selectedOrderIds.length > 0 && (
        <p className="text-xs text-muted-foreground">{selectedOrderIds.length} order(s) selected</p>
      )}
    </div>
  );
}
