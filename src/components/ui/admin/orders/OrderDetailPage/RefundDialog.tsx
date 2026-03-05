"use client";

import { useState } from "react";
import { Loader2, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/lib/hooks/useToastV8";
import { extractErrorMessage } from "@/lib/utils/api-error";
import { formatPrice } from "@/lib/utils/currency";
import type { OrderDetailItem } from "./types";

interface RefundDialogProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  items: OrderDetailItem[];
  deliveryFeeCents: number;
  /** Used for refund ceiling validation display */
  totalCents?: number;
  onRefundComplete: () => void;
}

interface RefundSelection {
  orderItemId: string;
  quantity: number;
  reason: string;
}

export function RefundDialog({
  open,
  onClose,
  orderId,
  items,
  deliveryFeeCents,
  onRefundComplete,
}: RefundDialogProps) {
  const [selections, setSelections] = useState<Record<string, RefundSelection>>({});
  const [refundShipping, setRefundShipping] = useState(false);
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [globalReason, setGlobalReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Filter to refundable items (not fully refunded)
  const refundableItems = items.filter((item) => item.quantity - item.refundedQuantity > 0);

  const toggleItem = (item: OrderDetailItem) => {
    setSelections((prev) => {
      const copy = { ...prev };
      if (copy[item.id]) {
        delete copy[item.id];
      } else {
        copy[item.id] = {
          orderItemId: item.id,
          quantity: item.quantity - item.refundedQuantity,
          reason: "",
        };
      }
      return copy;
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    setSelections((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity },
    }));
  };

  // Calculate estimated refund total
  const estimatedRefund =
    Object.values(selections).reduce((sum, sel) => {
      const item = items.find((i) => i.id === sel.orderItemId);
      if (!item) return sum;
      const unitPrice = item.lineTotal / item.quantity;
      return sum + Math.round(unitPrice * sel.quantity);
    }, 0) + (refundShipping ? deliveryFeeCents : 0);

  const selectedCount = Object.keys(selections).length;
  const canSubmit = selectedCount > 0;

  const handleSelectAll = () => {
    if (selectedCount === refundableItems.length) {
      setSelections({});
    } else {
      const all: Record<string, RefundSelection> = {};
      for (const item of refundableItems) {
        all[item.id] = {
          orderItemId: item.id,
          quantity: item.quantity - item.refundedQuantity,
          reason: "",
        };
      }
      setSelections(all);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      const refundItems = Object.values(selections).map((sel) => ({
        orderItemId: sel.orderItemId,
        quantity: sel.quantity,
        reason: globalReason || undefined,
      }));

      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: refundItems,
          refundShipping,
          notifyCustomer,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(extractErrorMessage(data, "Failed to process refund"));
      }

      const result = await res.json();
      toast({
        message: `Refund of ${formatPrice(result.totalRefundCents)} processed`,
        type: "success",
      });
      onRefundComplete();
      onClose();
    } catch (err) {
      toast({
        message: err instanceof Error ? err.message : "Failed to process refund",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Issue Refund" size="lg">
      <div className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Issue Refund</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Select items to refund. Refund will be applied to the original payment method.
          </p>
        </div>

        {refundableItems.length === 0 ? (
          <p className="text-sm text-text-muted py-4 text-center">
            All items have been fully refunded.
          </p>
        ) : (
          <>
            {/* Select all */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-medium text-primary hover:underline"
              >
                {selectedCount === refundableItems.length ? "Deselect All" : "Select All"}
              </button>
              <span className="text-xs text-text-muted">
                {selectedCount} of {refundableItems.length} selected
              </span>
            </div>

            {/* Item list */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {refundableItems.map((item) => {
                const isSelected = !!selections[item.id];
                const remainingQty = item.quantity - item.refundedQuantity;
                const unitPrice = item.lineTotal / item.quantity;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-lg border p-3 transition-colors cursor-pointer",
                      isSelected
                        ? "border-primary bg-primary-light/30"
                        : "border-border hover:border-border-strong"
                    )}
                    onClick={() => toggleItem(item)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItem(item)}
                          className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div>
                          <span className="text-sm font-medium text-text-primary">{item.name}</span>
                          <p className="text-xs text-text-muted mt-0.5">
                            {formatPrice(unitPrice)} each | {remainingQty} refundable
                            {item.refundedQuantity > 0 && (
                              <span className="text-status-error ml-1">
                                ({item.refundedQuantity} already refunded)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-text-primary flex-shrink-0">
                        {formatPrice(item.lineTotal)}
                      </span>
                    </div>

                    {/* Quantity selector when selected */}
                    {isSelected && (
                      <div
                        className="mt-2 ml-7 flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <label className="text-xs text-text-secondary">Qty:</label>
                        <select
                          value={selections[item.id]?.quantity ?? remainingQty}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value, 10))}
                          className={cn(
                            "rounded-md border border-border bg-surface-primary px-2 py-1 text-sm",
                            "text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                          )}
                        >
                          {Array.from({ length: remainingQty }, (_, i) => i + 1).map((q) => (
                            <option key={q} value={q}>
                              {q}
                            </option>
                          ))}
                        </select>
                        <span className="text-xs text-text-muted">
                          ={" "}
                          {formatPrice(
                            Math.round(unitPrice * (selections[item.id]?.quantity ?? remainingQty))
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Refund shipping */}
            {deliveryFeeCents > 0 && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={refundShipping}
                  onChange={(e) => setRefundShipping(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                />
                <span className="text-sm text-text-primary">
                  Refund shipping ({formatPrice(deliveryFeeCents)})
                </span>
              </label>
            )}

            {/* Notify customer */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyCustomer}
                onChange={(e) => setNotifyCustomer(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
              />
              <span className="text-sm text-text-primary">Notify customer by email</span>
            </label>

            {/* Reason */}
            <div>
              <label
                htmlFor="refund-reason"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                Reason (optional)
              </label>
              <textarea
                id="refund-reason"
                value={globalReason}
                onChange={(e) => setGlobalReason(e.target.value)}
                placeholder="Reason for refund"
                rows={2}
                className={cn(
                  "w-full rounded-lg border border-border bg-surface-primary px-3 py-2 text-sm",
                  "text-text-primary placeholder:text-text-muted",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30",
                  "resize-none"
                )}
              />
            </div>

            {/* Estimated total */}
            {selectedCount > 0 && (
              <div className="rounded-lg bg-surface-secondary p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                  <DollarSign className="h-4 w-4" />
                  Estimated Refund
                </div>
                <span className="text-lg font-display font-bold text-status-error">
                  {formatPrice(estimatedRefund)}
                </span>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={submitting} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleSubmit}
            disabled={submitting || !canSubmit}
            className="flex-1"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Process Refund
          </Button>
        </div>
      </div>
    </Modal>
  );
}
