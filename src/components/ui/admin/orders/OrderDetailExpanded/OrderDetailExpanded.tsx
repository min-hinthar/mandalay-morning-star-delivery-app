"use client";

import { useState, useEffect, useCallback } from "react";
import { m } from "framer-motion";
import {
  Phone,
  Mail,
  MessageSquare,
  MapPin,
  User,
  Truck,
  Clock,
  XCircle,
  RefreshCw,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/hooks/useToast";
import { staggerContainer, staggerItem } from "@/lib/motion-tokens";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/types/database";
import type { OrderDetail, Driver, OrderDetailExpandedProps } from "./types";
import { STATUS_COLORS, STATUS_LABELS, NEXT_STATUSES } from "./config";
import { CancelModal } from "./CancelModal";
import { RefundModal } from "./RefundModal";
import { OrderItemsSection } from "./OrderItemsSection";
import { AuditLogSection } from "./AuditLogSection";

export function OrderDetailExpanded({ orderId, onUpdate }: OrderDetailExpandedProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action states
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [assigningDriver, setAssigningDriver] = useState(false);
  const [editingItems, setEditingItems] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  // Driver list for assignment
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  // Edit items state
  const [editedQuantities, setEditedQuantities] = useState<Record<string, number>>({});
  const [editReason, setEditReason] = useState("");

  // Cancel/refund state
  const [cancelReason, setCancelReason] = useState("");
  const [refundItems, setRefundItems] = useState<{ id: string; quantity: number }[]>([]);
  const [refundReason, setRefundReason] = useState("");

  // Data fetching
  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/orders/${orderId}/details`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch order details");
      }
      const data = await res.json();
      setOrder(data);
      setSelectedDriverId(data.assignedDriverId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/drivers");
      if (res.ok) {
        const data = await res.json();
        setDrivers(data.filter((d: Driver) => d.isActive));
      }
    } catch {
      // Silent fail - driver list is optional
    }
  }, []);

  useEffect(() => {
    fetchOrderDetails();
    fetchDrivers();
  }, [fetchOrderDetails, fetchDrivers]);

  // Action handlers
  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;
    try {
      setUpdatingStatus(true);
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }
      toast({ title: "Status updated", description: `Order is now ${STATUS_LABELS[newStatus]}` });
      await fetchOrderDetails();
      onUpdate();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to update status", variant: "destructive" });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignDriver = async () => {
    if (!order) return;
    try {
      setAssigningDriver(true);
      const res = await fetch(`/api/admin/orders/${orderId}/driver`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: selectedDriverId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to assign driver");
      }
      toast({ title: selectedDriverId ? "Driver assigned" : "Driver unassigned", description: selectedDriverId ? "Driver assigned to order" : "Driver removed from order" });
      await fetchOrderDetails();
      onUpdate();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to assign driver", variant: "destructive" });
    } finally {
      setAssigningDriver(false);
    }
  };

  const handleSaveItemEdits = async () => {
    if (!order || !editReason.trim()) return;
    try {
      setEditingItems(true);
      const items = Object.entries(editedQuantities).map(([id, quantity]) => ({ id, quantity }));
      if (items.length === 0) {
        toast({ title: "No changes", description: "No item quantities were changed" });
        return;
      }
      const res = await fetch(`/api/admin/orders/${orderId}/items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, reason: editReason }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update items");
      }
      toast({ title: "Items updated", description: "Order items have been modified" });
      setEditedQuantities({});
      setEditReason("");
      await fetchOrderDetails();
      onUpdate();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to update items", variant: "destructive" });
    } finally {
      setEditingItems(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason, notifyCustomer: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to cancel order");
      }
      toast({ title: "Order cancelled", description: "The order has been cancelled" });
      setShowCancelModal(false);
      setCancelReason("");
      await fetchOrderDetails();
      onUpdate();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to cancel order", variant: "destructive" });
    }
  };

  const handleRefund = async () => {
    if (refundItems.length === 0 || !refundReason.trim()) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: refundItems.map((i) => ({ orderItemId: i.id, quantity: i.quantity, reason: refundReason })),
          refundShipping: false,
          notifyCustomer: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to process refund");
      }
      toast({ title: "Refund processed", description: "Items have been refunded" });
      setShowRefundModal(false);
      setRefundItems([]);
      setRefundReason("");
      await fetchOrderDetails();
      onUpdate();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to process refund", variant: "destructive" });
    }
  };

  // Render
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center py-12 text-status-error">
        <AlertCircle className="h-5 w-5 mr-2" />
        <span>{error || "Order not found"}</span>
      </div>
    );
  }

  const nextStatuses = NEXT_STATUSES[order.status];
  const canRefund = ["delivered", "cancelled"].includes(order.status);
  const canAssignDriver = ["confirmed", "preparing", "out_for_delivery"].includes(order.status);
  const canEditItems = !["delivered", "cancelled"].includes(order.status);

  return (
    <m.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer(0.05, 0.1)}
      className="space-y-6"
    >
      {/* Row 1: Customer Info + Status Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Info */}
        <m.div variants={staggerItem} className="space-y-4">
          <div className="flex items-center gap-2 text-text-muted">
            <User className="h-4 w-4" />
            <span className="text-xs font-body font-semibold uppercase tracking-wider">Customer</span>
          </div>
          <div className="space-y-2">
            <p className="font-display font-semibold text-text-primary">{order.customerName || "Guest"}</p>
            <div className="flex flex-wrap gap-2">
              <a href={`mailto:${order.customerEmail}`} className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-input text-sm", "bg-surface-tertiary hover:bg-primary-light text-text-secondary hover:text-primary", "transition-colors duration-fast")}>
                <Mail className="h-3.5 w-3.5" />{order.customerEmail}
              </a>
              {order.customerPhone && (
                <>
                  <a href={`tel:${order.customerPhone}`} className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-input text-sm", "bg-accent-teal/10 hover:bg-accent-teal/20 text-accent-teal", "transition-colors duration-fast")}>
                    <Phone className="h-3.5 w-3.5" />Call
                  </a>
                  <a href={`sms:${order.customerPhone}`} className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-input text-sm", "bg-accent-magenta/10 hover:bg-accent-magenta/20 text-accent-magenta", "transition-colors duration-fast")}>
                    <MessageSquare className="h-3.5 w-3.5" />Text
                  </a>
                </>
              )}
            </div>
            {order.address && (
              <div className="flex items-start gap-2 mt-3 text-sm text-text-secondary">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  {order.address.street}{order.address.apt && `, ${order.address.apt}`}<br />
                  {order.address.city}, {order.address.state} {order.address.zip}
                </span>
              </div>
            )}
          </div>
        </m.div>

        {/* Status & Actions */}
        <m.div variants={staggerItem} className="space-y-4">
          <div className="flex items-center gap-2 text-text-muted">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-body font-semibold uppercase tracking-wider">Status & Actions</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge className={cn(STATUS_COLORS[order.status], "text-sm px-3 py-1")}>{STATUS_LABELS[order.status]}</Badge>
              <span className="text-xs text-text-muted">Placed {format(parseISO(order.placedAt), "MMM d, h:mm a")}</span>
            </div>
            {nextStatuses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map(({ status, label }) => (
                  <Button key={status} size="sm" variant={status === "cancelled" ? "outline" : "default"} onClick={() => status === "cancelled" ? setShowCancelModal(true) : handleStatusChange(status)} disabled={updatingStatus} className={cn(status === "cancelled" && "border-status-error text-status-error hover:bg-status-error/10")}>
                    {updatingStatus ? (<Loader2 className="h-3 w-3 animate-spin mr-1" />) : status === "delivered" ? (<Check className="h-3 w-3 mr-1" />) : status === "cancelled" ? (<XCircle className="h-3 w-3 mr-1" />) : null}
                    {label}
                  </Button>
                ))}
              </div>
            )}
            {canRefund && (
              <Button size="sm" variant="outline" onClick={() => setShowRefundModal(true)} className="border-secondary text-secondary hover:bg-secondary/10">
                <RefreshCw className="h-3 w-3 mr-1" />Process Refund
              </Button>
            )}
          </div>
        </m.div>
      </div>

      {/* Row 2: Items + Driver Assignment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrderItemsSection
          items={order.items}
          subtotalCents={order.subtotalCents}
          deliveryFeeCents={order.deliveryFeeCents}
          taxCents={order.taxCents}
          totalCents={order.totalCents}
          canEditItems={canEditItems}
          editedQuantities={editedQuantities}
          onStartEditing={() => {
            const initial: Record<string, number> = {};
            order.items.forEach((item) => { initial[item.id] = item.quantity; });
            setEditedQuantities(initial);
          }}
          onQuantityChange={(id, qty) => setEditedQuantities((prev) => ({ ...prev, [id]: qty }))}
          onCancelEditing={() => { setEditedQuantities({}); setEditReason(""); }}
          editReason={editReason}
          onEditReasonChange={setEditReason}
          onSaveEdits={handleSaveItemEdits}
          editingItems={editingItems}
        />

        {/* Driver Assignment */}
        <m.div variants={staggerItem} className="space-y-4">
          <div className="flex items-center gap-2 text-text-muted">
            <Truck className="h-4 w-4" />
            <span className="text-xs font-body font-semibold uppercase tracking-wider">Driver Assignment</span>
          </div>
          {order.assignedDriverName ? (
            <div className="flex items-center gap-3 p-3 rounded-input bg-accent-teal/10">
              <div className="w-10 h-10 rounded-full bg-accent-teal/20 flex items-center justify-center">
                <User className="h-5 w-5 text-accent-teal" />
              </div>
              <div>
                <p className="font-medium text-text-primary">{order.assignedDriverName}</p>
                <p className="text-xs text-text-muted">Assigned Driver</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted">No driver assigned</p>
          )}
          {canAssignDriver && (
            <div className="space-y-3">
              <select value={selectedDriverId || ""} onChange={(e) => setSelectedDriverId(e.target.value || null)} className={cn("w-full px-3 py-2 rounded-input text-sm", "bg-surface-tertiary border border-border", "focus:outline-none focus:ring-2 focus:ring-primary/30")}>
                <option value="">-- No Driver --</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>{driver.fullName || driver.email}{driver.vehicleType && ` (${driver.vehicleType})`}</option>
                ))}
              </select>
              <Button size="sm" onClick={handleAssignDriver} disabled={assigningDriver || selectedDriverId === order.assignedDriverId}>
                {assigningDriver && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                {selectedDriverId ? "Assign Driver" : "Remove Driver"}
              </Button>
            </div>
          )}
          {order.specialInstructions && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-text-muted">
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs font-body font-semibold uppercase tracking-wider">Customer Notes</span>
              </div>
              <p className="text-sm text-text-primary italic bg-surface-tertiary/50 rounded-input px-3 py-2 border-l-2 border-primary/30">
                &ldquo;{order.specialInstructions}&rdquo;
              </p>
            </div>
          )}
        </m.div>
      </div>

      {/* Row 3: Audit Log */}
      <AuditLogSection auditLog={order.auditLog} />

      {/* Modals */}
      <CancelModal show={showCancelModal} onClose={() => setShowCancelModal(false)} cancelReason={cancelReason} onCancelReasonChange={setCancelReason} onConfirm={handleCancel} />
      <RefundModal show={showRefundModal} onClose={() => setShowRefundModal(false)} items={order.items} refundItems={refundItems} onRefundItemsChange={setRefundItems} refundReason={refundReason} onRefundReasonChange={setRefundReason} onConfirm={handleRefund} />
    </m.div>
  );
}
