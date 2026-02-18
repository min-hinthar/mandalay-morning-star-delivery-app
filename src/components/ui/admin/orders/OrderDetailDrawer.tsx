"use client";

import { useEffect, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { overlay } from "@/lib/motion-tokens/variants";
import { transition } from "@/lib/motion-tokens/core";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/admin/StatusBadge";
import { formatPrice } from "@/lib/utils/currency";
import { format, parseISO } from "date-fns";
import type { AdminOrder } from "@/components/ui/admin/OrdersTable";
import type { OrderStatus } from "@/types/database";

// ============================================
// STATUS TRANSITION RULES
// ============================================

const NEXT_STATUSES: Record<OrderStatus, { status: OrderStatus; label: string }[]> = {
  pending: [
    { status: "confirmed", label: "Confirm Order" },
    { status: "cancelled", label: "Cancel" },
  ],
  confirmed: [
    { status: "preparing", label: "Start Preparing" },
    { status: "cancelled", label: "Cancel" },
  ],
  preparing: [
    { status: "out_for_delivery", label: "Send Out" },
    { status: "cancelled", label: "Cancel" },
  ],
  out_for_delivery: [{ status: "delivered", label: "Mark Delivered" }],
  delivered: [],
  cancelled: [],
};

// ============================================
// TYPES
// ============================================

export interface OrderDetailDrawerProps {
  order: AdminOrder | null;
  open: boolean;
  onClose: () => void;
  onStatusChange?: (orderId: string, newStatus: OrderStatus) => Promise<void>;
}

// ============================================
// COMPONENT
// ============================================

export function OrderDetailDrawer({
  order,
  open,
  onClose,
  onStatusChange,
}: OrderDetailDrawerProps) {
  // ESC key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll when drawer is open
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  const nextStatuses = order ? NEXT_STATUSES[order.status] : [];

  return (
    <AnimatePresence>
      {open && order && (
        <>
          {/* Backdrop */}
          <m.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition.normal}
            className="fixed inset-0 z-40 bg-surface-inverse/40"
            onClick={onClose}
          />

          {/* Panel */}
          <m.div
            key="drawer-panel"
            variants={overlay.drawer}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              "fixed right-0 top-0 bottom-0 z-50",
              "w-full sm:w-[480px]",
              "bg-surface-primary shadow-2xl",
              "overflow-y-auto"
            )}
          >
            {/* Close button */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-surface-primary/95 border-b border-border">
              <h2 className="font-display text-lg font-bold text-text-primary">Order Details</h2>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>

            <div className="p-4 space-y-6">
              {/* Order header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-text-muted">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <StatusBadge status={order.status} size="md" />
                </div>
                <p className="text-xs text-text-muted">
                  Placed {format(parseISO(order.placedAt), "EEEE, MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>

              {/* Customer info */}
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Customer
                </h3>
                <div className="rounded-xl bg-surface-secondary p-3 space-y-1">
                  <p className="font-medium text-text-primary">{order.customerName || "Guest"}</p>
                  <p className="text-sm text-text-muted">{order.customerEmail}</p>
                </div>
              </section>

              {/* Order summary */}
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Summary
                </h3>
                <div className="rounded-xl bg-surface-secondary p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Items</span>
                    <span className="font-medium text-text-primary">
                      {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                    </span>
                  </div>
                  {order.deliveryWindowStart && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Delivery</span>
                      <span className="font-medium text-text-primary">
                        {format(parseISO(order.deliveryWindowStart), "EEE, MMM d")}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-border pt-2 flex items-center justify-between">
                    <span className="font-medium text-text-primary">Total</span>
                    <span className="font-display font-bold text-lg text-text-primary">
                      {formatPrice(order.totalCents)}
                    </span>
                  </div>
                </div>
              </section>

              {/* Action buttons */}
              {nextStatuses.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Actions
                  </h3>
                  <div className="flex flex-col gap-2">
                    {nextStatuses.map(({ status, label }) => (
                      <Button
                        key={status}
                        variant={status === "cancelled" ? "outline" : "default"}
                        size="sm"
                        className={cn(
                          "w-full justify-center",
                          status === "cancelled" &&
                            "border-status-error text-status-error hover:bg-status-error/10",
                          status !== "cancelled" &&
                            "bg-accent-teal hover:bg-accent-teal/90 text-text-inverse"
                        )}
                        onClick={() => onStatusChange?.(order.id, status)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </section>
              )}

              {/* View full page link */}
              <div className="pt-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-accent-teal hover:text-accent-teal hover:bg-accent-teal/10"
                  asChild
                >
                  <a href={`/admin/orders/${order.id}`}>View Full Order Page</a>
                </Button>
              </div>
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}
