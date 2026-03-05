"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Check, Package, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { logger } from "@/lib/utils/logger";

interface UnassignedOrder {
  id: string;
  totalCents: number;
  customerName: string | null;
  itemCount: number;
  addressLine1: string | null;
  city: string | null;
}

interface AddStopsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routeId: string;
  onStopsAdded: () => void;
}

export function AddStopsModal({ open, onOpenChange, routeId, onStopsAdded }: AddStopsModalProps) {
  const [orders, setOrders] = useState<UnassignedOrder[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedIds([]);
      setError(null);
      fetchUnassignedOrders();
    }
  }, [open]);

  const fetchUnassignedOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/routes/builder-orders");
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      logger.error("Failed to fetch unassigned orders", { api: "builder-orders" });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrder = (orderId: string) => {
    setSelectedIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
    if (error) setError(null);
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/routes/${routeId}/stops`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: selectedIds }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add stops");
      }

      onStopsAdded();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add stops");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-surface-secondary to-surface-tertiary border-border-v5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl text-text-primary">
            <div className="p-2 rounded-lg bg-gradient-to-br from-interactive-primary to-accent-tertiary text-text-inverse">
              <Plus className="h-5 w-5" />
            </div>
            Add Stops to Route
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select unassigned orders to add as new stops on this route.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Select All / Clear */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <Package className="h-4 w-4 text-interactive-primary" />
              Unassigned Orders
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(orders.map((o) => o.id))}
                disabled={orders.length === 0 || submitting}
                className="text-xs h-7"
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds([])}
                disabled={selectedIds.length === 0 || submitting}
                className="text-xs h-7"
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Order List */}
          <div className="max-h-64 overflow-y-auto rounded-lg border border-border-v5 bg-surface-primary">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-interactive-primary" />
              </div>
            ) : orders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No unassigned orders available
              </p>
            ) : (
              <div className="divide-y divide-border-v5/50">
                {orders.map((order) => {
                  const isSelected = selectedIds.includes(order.id);
                  return (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => toggleOrder(order.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 text-left transition-colors",
                        isSelected ? "bg-interactive-primary-light" : "hover:bg-surface-secondary"
                      )}
                      disabled={submitting}
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
                            {order.customerName || "Guest"} &middot; {order.itemCount} items
                          </p>
                          {order.addressLine1 && (
                            <p className="text-xs text-text-muted">
                              {order.addressLine1}
                              {order.city ? `, ${order.city}` : ""}
                            </p>
                          )}
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

          {selectedIds.length > 0 && (
            <p className="text-xs text-muted-foreground">{selectedIds.length} order(s) selected</p>
          )}
        </div>

        <DialogFooter className="gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={submitting}
            className="border-border-v5 hover:bg-surface-tertiary"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || selectedIds.length === 0}
            className="bg-gradient-to-r from-interactive-primary to-accent-tertiary hover:opacity-90 text-text-inverse shadow-md"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add {selectedIds.length || ""} Stop{selectedIds.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
