"use client";

import { m } from "framer-motion";
import { Package, Edit2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/currency";
import { staggerItem } from "@/lib/motion-tokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { OrderItem } from "./types";

interface OrderItemsSectionProps {
  items: OrderItem[];
  subtotalCents: number;
  deliveryFeeCents: number;
  taxCents: number;
  totalCents: number;
  canEditItems: boolean;
  editedQuantities: Record<string, number>;
  onStartEditing: () => void;
  onQuantityChange: (id: string, quantity: number) => void;
  onCancelEditing: () => void;
  editReason: string;
  onEditReasonChange: (reason: string) => void;
  onSaveEdits: () => void;
  editingItems: boolean;
}

export function OrderItemsSection({
  items,
  subtotalCents,
  deliveryFeeCents,
  taxCents,
  totalCents,
  canEditItems,
  editedQuantities,
  onStartEditing,
  onQuantityChange,
  onCancelEditing,
  editReason,
  onEditReasonChange,
  onSaveEdits,
  editingItems,
}: OrderItemsSectionProps) {
  return (
    <m.div variants={staggerItem} className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-text-muted">
          <Package className="h-4 w-4" />
          <span className="text-xs font-body font-semibold uppercase tracking-wider">
            Items ({items.length})
          </span>
        </div>
        {canEditItems && Object.keys(editedQuantities).length === 0 && (
          <Button size="sm" variant="ghost" onClick={onStartEditing}>
            <Edit2 className="h-3 w-3 mr-1" />
            Edit
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const isEditing = editedQuantities[item.id] !== undefined;
          const editedQty = editedQuantities[item.id];
          const displayQty = isEditing ? editedQty : item.quantity;
          const isChanged = isEditing && editedQty !== item.quantity;

          return (
            <div
              key={item.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-input",
                "bg-surface-tertiary/50",
                isChanged && "ring-1 ring-primary/30"
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-text-primary truncate">
                  {item.name}
                </p>
                {item.specialInstructions && (
                  <p className="text-xs text-text-muted italic">
                    {item.specialInstructions}
                  </p>
                )}
                {item.refundedQuantity > 0 && (
                  <p className="text-xs text-status-error">
                    {item.refundedQuantity} refunded
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                {isEditing ? (
                  <Input
                    type="number"
                    min={0}
                    max={item.quantity + 10}
                    value={editedQty}
                    onChange={(e) =>
                      onQuantityChange(item.id, parseInt(e.target.value) || 0)
                    }
                    className="w-16 h-8 text-center"
                  />
                ) : (
                  <span className="text-primary font-medium">{displayQty}x</span>
                )}
                <span className="text-sm font-mono text-text-secondary w-16 text-right">
                  {formatPrice(isEditing ? item.basePrice * editedQty : item.lineTotal)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit mode controls */}
      {Object.keys(editedQuantities).length > 0 && (
        <div className="space-y-3 pt-2 border-t border-border">
          <Textarea
            placeholder="Reason for changes..."
            value={editReason}
            onChange={(e) => onEditReasonChange(e.target.value)}
            className="resize-none"
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={onSaveEdits}
              disabled={!editReason.trim() || editingItems}
            >
              {editingItems && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              Save Changes
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancelEditing}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="space-y-1 pt-2 border-t border-border text-sm">
        <div className="flex justify-between text-text-secondary">
          <span>Subtotal</span>
          <span>{formatPrice(subtotalCents)}</span>
        </div>
        <div className="flex justify-between text-text-secondary">
          <span>Delivery</span>
          <span>{formatPrice(deliveryFeeCents)}</span>
        </div>
        <div className="flex justify-between text-text-secondary">
          <span>Tax</span>
          <span>{formatPrice(taxCents)}</span>
        </div>
        <div className="flex justify-between font-display font-bold text-text-primary pt-1">
          <span>Total</span>
          <span className="text-primary">{formatPrice(totalCents)}</span>
        </div>
      </div>
    </m.div>
  );
}
