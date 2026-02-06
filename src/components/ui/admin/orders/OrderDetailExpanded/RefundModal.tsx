"use client";

import { m, AnimatePresence } from "framer-motion";
import { spring } from "@/lib/motion-tokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { OrderItem } from "./types";

interface RefundModalProps {
  show: boolean;
  onClose: () => void;
  items: OrderItem[];
  refundItems: { id: string; quantity: number }[];
  onRefundItemsChange: (items: { id: string; quantity: number }[]) => void;
  refundReason: string;
  onRefundReasonChange: (reason: string) => void;
  onConfirm: () => void;
}

export function RefundModal({
  show,
  onClose,
  items,
  refundItems,
  onRefundItemsChange,
  refundReason,
  onRefundReasonChange,
  onConfirm,
}: RefundModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-surface-inverse/50"
          onClick={onClose}
        >
          <m.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={spring.default}
            className="bg-surface-primary rounded-card-md p-6 w-full max-w-md mx-4 shadow-lg max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display font-bold text-lg text-text-primary mb-4">
              Process Refund
            </h3>

            <div className="space-y-3 mb-4">
              {items.map((item) => {
                const refundable = item.quantity - item.refundedQuantity;
                const selected = refundItems.find((r) => r.id === item.id);

                if (refundable <= 0) return null;

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-input bg-surface-tertiary/50"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-text-muted">
                        {refundable} available to refund
                      </p>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={refundable}
                      value={selected?.quantity || 0}
                      onChange={(e) => {
                        const qty = parseInt(e.target.value) || 0;
                        if (qty === 0) {
                          onRefundItemsChange(refundItems.filter((r) => r.id !== item.id));
                        } else {
                          const existing = refundItems.find((r) => r.id === item.id);
                          if (existing) {
                            onRefundItemsChange(
                              refundItems.map((r) =>
                                r.id === item.id ? { ...r, quantity: qty } : r
                              )
                            );
                          } else {
                            onRefundItemsChange([...refundItems, { id: item.id, quantity: qty }]);
                          }
                        }
                      }}
                      className="w-20 h-8 text-center"
                    />
                  </div>
                );
              })}
            </div>

            <Textarea
              placeholder="Reason for refund (required)..."
              value={refundReason}
              onChange={(e) => onRefundReasonChange(e.target.value)}
              className="resize-none mb-4"
              rows={2}
            />

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={onClose}>
                Back
              </Button>
              <Button
                onClick={onConfirm}
                disabled={refundItems.length === 0 || refundReason.length < 5}
              >
                Process Refund
              </Button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
