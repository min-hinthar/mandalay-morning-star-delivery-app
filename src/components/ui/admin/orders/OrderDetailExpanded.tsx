/**
 * OrderDetailExpanded Component
 *
 * Expanded order detail view with full CRUD actions for admin orders table.
 * Shows customer info, items, status, driver assignment, and audit log.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Mail,
  MessageSquare,
  MapPin,
  Package,
  User,
  Truck,
  Clock,
  XCircle,
  RefreshCw,
  Edit2,
  Check,
  History,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/currency";
import { toast } from "@/lib/hooks/useToast";
import { spring, staggerContainer, staggerItem } from "@/lib/motion-tokens";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { OrderStatus } from "@/types/database";

// ============================================
// TYPES
// ============================================

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  basePrice: number;
  lineTotal: number;
  refundedQuantity: number;
  specialInstructions: string | null;
}

interface OrderAddress {
  street: string;
  apt: string | null;
  city: string;
  state: string;
  zip: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  actorRole: string;
  reason: string | null;
  createdAt: string;
}

interface Driver {
  id: string;
  fullName: string | null;
  email: string;
  phone: string | null;
  vehicleType: string | null;
  isActive: boolean;
}

interface OrderDetail {
  id: string;
  status: OrderStatus;
  customerName: string | null;
  customerEmail: string;
  customerPhone: string | null;
  address: OrderAddress | null;
  items: OrderItem[];
  subtotalCents: number;
  deliveryFeeCents: number;
  taxCents: number;
  totalCents: number;
  specialInstructions: string | null;
  placedAt: string;
  confirmedAt: string | null;
  deliveredAt: string | null;
  assignedDriverId: string | null;
  assignedDriverName: string | null;
  auditLog: AuditLogEntry[];
}

interface OrderDetailExpandedProps {
  orderId: string;
  onUpdate: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-secondary-light text-secondary-hover",
  confirmed: "bg-accent-teal/10 text-accent-teal",
  preparing: "bg-accent-magenta/10 text-accent-magenta",
  out_for_delivery: "bg-primary/10 text-primary",
  delivered: "bg-green/10 text-green",
  cancelled: "bg-status-error/10 text-status-error",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

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

const AUDIT_ACTION_LABELS: Record<string, string> = {
  status_change: "Status Changed",
  cancel: "Order Cancelled",
  refund: "Refund Processed",
  edit: "Order Edited",
  update_items: "Items Updated",
  assign_driver: "Driver Assigned",
  unassign_driver: "Driver Unassigned",
};

// ============================================
// COMPONENT
// ============================================

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

  // ============================================
  // DATA FETCHING
  // ============================================

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

  // ============================================
  // ACTION HANDLERS
  // ============================================

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

      toast({
        title: "Status updated",
        description: `Order is now ${STATUS_LABELS[newStatus]}`,
      });

      await fetchOrderDetails();
      onUpdate();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update status",
        variant: "destructive",
      });
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

      toast({
        title: selectedDriverId ? "Driver assigned" : "Driver unassigned",
        description: selectedDriverId
          ? `Driver assigned to order`
          : "Driver removed from order",
      });

      await fetchOrderDetails();
      onUpdate();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to assign driver",
        variant: "destructive",
      });
    } finally {
      setAssigningDriver(false);
    }
  };

  const handleSaveItemEdits = async () => {
    if (!order || !editReason.trim()) return;

    try {
      setEditingItems(true);

      const items = Object.entries(editedQuantities).map(([id, quantity]) => ({
        id,
        quantity,
      }));

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

      toast({
        title: "Items updated",
        description: "Order items have been modified",
      });

      setEditedQuantities({});
      setEditReason("");
      await fetchOrderDetails();
      onUpdate();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update items",
        variant: "destructive",
      });
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

      toast({
        title: "Order cancelled",
        description: "The order has been cancelled",
      });

      setShowCancelModal(false);
      setCancelReason("");
      await fetchOrderDetails();
      onUpdate();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to cancel order",
        variant: "destructive",
      });
    }
  };

  const handleRefund = async () => {
    if (refundItems.length === 0 || !refundReason.trim()) return;

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: refundItems.map((i) => ({
            orderItemId: i.id,
            quantity: i.quantity,
            reason: refundReason,
          })),
          refundShipping: false,
          notifyCustomer: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to process refund");
      }

      toast({
        title: "Refund processed",
        description: "Items have been refunded",
      });

      setShowRefundModal(false);
      setRefundItems([]);
      setRefundReason("");
      await fetchOrderDetails();
      onUpdate();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to process refund",
        variant: "destructive",
      });
    }
  };

  // ============================================
  // RENDER
  // ============================================

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
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer(0.05, 0.1)}
      className="space-y-6"
    >
      {/* Row 1: Customer Info + Status Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Info */}
        <motion.div variants={staggerItem} className="space-y-4">
          <div className="flex items-center gap-2 text-text-muted">
            <User className="h-4 w-4" />
            <span className="text-xs font-body font-semibold uppercase tracking-wider">
              Customer
            </span>
          </div>

          <div className="space-y-2">
            <p className="font-display font-semibold text-text-primary">
              {order.customerName || "Guest"}
            </p>

            <div className="flex flex-wrap gap-2">
              <a
                href={`mailto:${order.customerEmail}`}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-input text-sm",
                  "bg-surface-tertiary hover:bg-primary-light text-text-secondary hover:text-primary",
                  "transition-colors duration-fast"
                )}
              >
                <Mail className="h-3.5 w-3.5" />
                {order.customerEmail}
              </a>

              {order.customerPhone && (
                <>
                  <a
                    href={`tel:${order.customerPhone}`}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-input text-sm",
                      "bg-accent-teal/10 hover:bg-accent-teal/20 text-accent-teal",
                      "transition-colors duration-fast"
                    )}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Call
                  </a>
                  <a
                    href={`sms:${order.customerPhone}`}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-input text-sm",
                      "bg-accent-magenta/10 hover:bg-accent-magenta/20 text-accent-magenta",
                      "transition-colors duration-fast"
                    )}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Text
                  </a>
                </>
              )}
            </div>

            {order.address && (
              <div className="flex items-start gap-2 mt-3 text-sm text-text-secondary">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  {order.address.street}
                  {order.address.apt && `, ${order.address.apt}`}
                  <br />
                  {order.address.city}, {order.address.state} {order.address.zip}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Status & Actions */}
        <motion.div variants={staggerItem} className="space-y-4">
          <div className="flex items-center gap-2 text-text-muted">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-body font-semibold uppercase tracking-wider">
              Status & Actions
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge className={cn(STATUS_COLORS[order.status], "text-sm px-3 py-1")}>
                {STATUS_LABELS[order.status]}
              </Badge>
              <span className="text-xs text-text-muted">
                Placed {format(parseISO(order.placedAt), "MMM d, h:mm a")}
              </span>
            </div>

            {nextStatuses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map(({ status, label }) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={status === "cancelled" ? "outline" : "default"}
                    onClick={() =>
                      status === "cancelled"
                        ? setShowCancelModal(true)
                        : handleStatusChange(status)
                    }
                    disabled={updatingStatus}
                    className={cn(
                      status === "cancelled" && "border-status-error text-status-error hover:bg-status-error/10"
                    )}
                  >
                    {updatingStatus ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : status === "delivered" ? (
                      <Check className="h-3 w-3 mr-1" />
                    ) : status === "cancelled" ? (
                      <XCircle className="h-3 w-3 mr-1" />
                    ) : null}
                    {label}
                  </Button>
                ))}
              </div>
            )}

            {canRefund && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRefundModal(true)}
                className="border-secondary text-secondary hover:bg-secondary/10"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Process Refund
              </Button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Row 2: Items + Driver Assignment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Items */}
        <motion.div variants={staggerItem} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-text-muted">
              <Package className="h-4 w-4" />
              <span className="text-xs font-body font-semibold uppercase tracking-wider">
                Items ({order.items.length})
              </span>
            </div>
            {canEditItems && Object.keys(editedQuantities).length === 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const initial: Record<string, number> = {};
                  order.items.forEach((item) => {
                    initial[item.id] = item.quantity;
                  });
                  setEditedQuantities(initial);
                }}
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Edit
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {order.items.map((item) => {
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
                          setEditedQuantities((prev) => ({
                            ...prev,
                            [item.id]: parseInt(e.target.value) || 0,
                          }))
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
                onChange={(e) => setEditReason(e.target.value)}
                className="resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveItemEdits}
                  disabled={!editReason.trim() || editingItems}
                >
                  {editingItems && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                  Save Changes
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditedQuantities({});
                    setEditReason("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="space-y-1 pt-2 border-t border-border text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>Delivery</span>
              <span>{formatPrice(order.deliveryFeeCents)}</span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>Tax</span>
              <span>{formatPrice(order.taxCents)}</span>
            </div>
            <div className="flex justify-between font-display font-bold text-text-primary pt-1">
              <span>Total</span>
              <span className="text-primary">{formatPrice(order.totalCents)}</span>
            </div>
          </div>
        </motion.div>

        {/* Driver Assignment */}
        <motion.div variants={staggerItem} className="space-y-4">
          <div className="flex items-center gap-2 text-text-muted">
            <Truck className="h-4 w-4" />
            <span className="text-xs font-body font-semibold uppercase tracking-wider">
              Driver Assignment
            </span>
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
              <select
                value={selectedDriverId || ""}
                onChange={(e) => setSelectedDriverId(e.target.value || null)}
                className={cn(
                  "w-full px-3 py-2 rounded-input text-sm",
                  "bg-surface-tertiary border border-border",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30"
                )}
              >
                <option value="">-- No Driver --</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.fullName || driver.email}
                    {driver.vehicleType && ` (${driver.vehicleType})`}
                  </option>
                ))}
              </select>

              <Button
                size="sm"
                onClick={handleAssignDriver}
                disabled={assigningDriver || selectedDriverId === order.assignedDriverId}
              >
                {assigningDriver && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                {selectedDriverId ? "Assign Driver" : "Remove Driver"}
              </Button>
            </div>
          )}

          {/* Special Instructions */}
          {order.specialInstructions && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-text-muted">
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs font-body font-semibold uppercase tracking-wider">
                  Customer Notes
                </span>
              </div>
              <p className="text-sm text-text-primary italic bg-surface-tertiary/50 rounded-input px-3 py-2 border-l-2 border-primary/30">
                &ldquo;{order.specialInstructions}&rdquo;
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Row 3: Audit Log */}
      <motion.div variants={staggerItem} className="space-y-4">
        <div className="flex items-center gap-2 text-text-muted">
          <History className="h-4 w-4" />
          <span className="text-xs font-body font-semibold uppercase tracking-wider">
            Activity Log
          </span>
        </div>

        {order.auditLog.length > 0 ? (
          <div className="space-y-2">
            {order.auditLog.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 p-2 rounded-input bg-surface-tertiary/30 text-sm"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary">
                    {AUDIT_ACTION_LABELS[entry.action] || entry.action}
                    {entry.reason && (
                      <span className="text-text-muted"> - {entry.reason}</span>
                    )}
                  </p>
                  <p className="text-xs text-text-muted">
                    {format(parseISO(entry.createdAt), "MMM d, h:mm a")} by {entry.actorRole}
                  </p>
                </div>
              </div>
            ))}
            {order.auditLog.length > 5 && (
              <p className="text-xs text-text-muted text-center">
                +{order.auditLog.length - 5} more entries
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-text-muted">No activity recorded</p>
        )}
      </motion.div>

      {/* Cancel Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-surface-inverse/50"
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={spring.default}
              className="bg-surface-primary rounded-card-md p-6 w-full max-w-md mx-4 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display font-bold text-lg text-text-primary mb-4">
                Cancel Order
              </h3>
              <Textarea
                placeholder="Reason for cancellation (required)..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="resize-none mb-4"
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setShowCancelModal(false)}>
                  Back
                </Button>
                <Button
                  variant="danger"
                  onClick={handleCancel}
                  disabled={cancelReason.length < 5}
                >
                  Cancel Order
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Refund Modal */}
      <AnimatePresence>
        {showRefundModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-surface-inverse/50"
            onClick={() => setShowRefundModal(false)}
          >
            <motion.div
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
                {order.items.map((item) => {
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
                            setRefundItems((prev) => prev.filter((r) => r.id !== item.id));
                          } else {
                            setRefundItems((prev) => {
                              const existing = prev.find((r) => r.id === item.id);
                              if (existing) {
                                return prev.map((r) =>
                                  r.id === item.id ? { ...r, quantity: qty } : r
                                );
                              }
                              return [...prev, { id: item.id, quantity: qty }];
                            });
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
                onChange={(e) => setRefundReason(e.target.value)}
                className="resize-none mb-4"
                rows={2}
              />

              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setShowRefundModal(false)}>
                  Back
                </Button>
                <Button
                  onClick={handleRefund}
                  disabled={refundItems.length === 0 || refundReason.length < 5}
                >
                  Process Refund
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
