"use client";

/**
 * Orders Tab Component
 * Display order history with reorder and cancel functionality
 *
 * Features:
 * - Full order history via client-side Supabase
 * - Reorder button adds items to cart via useCartStore
 * - Cancel button for pending/confirmed orders (requires reason)
 * - Status badges with semantic colors
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  ChevronRight,
  RefreshCcw,
  X,
  Loader2,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/hooks/useToastV8";
import { useCartStore } from "@/lib/stores/cart-store";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils/currency";
import { format, parseISO } from "date-fns";
import type { OrderStatus } from "@/types/order";

interface Order {
  id: string;
  status: OrderStatus;
  totalCents: number;
  deliveryWindowStart: string | null;
  placedAt: string;
  itemCount: number;
}

interface ReorderCartItem {
  menuItemId: string;
  name: string;
  quantity: number;
  priceCents: number;
  modifiers: Array<{
    optionId: string | null;
    name: string;
    priceDeltaCents: number;
  }>;
  specialInstructions: string | null;
}

interface ReorderWarning {
  menuItemId: string | null;
  itemName: string;
  type: "unavailable" | "sold_out" | "price_changed";
  message: string;
}

// Status labels and colors
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending Payment",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-blue-100 text-blue-800",
  out_for_delivery: "bg-amber-100 text-amber-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

// Cancellable statuses
const CANCELLABLE_STATUSES: OrderStatus[] = ["pending", "confirmed"];

// Database row type
interface OrderRow {
  id: string;
  status: OrderStatus;
  total_cents: number;
  delivery_window_start: string | null;
  placed_at: string;
  order_items: Array<{ quantity: number }>;
}

export function OrdersTab() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const { shouldAnimate } = useAnimationPreference();

  // Memoize Supabase client
  const supabase = useMemo(() => createClient(), []);

  // Cart store actions
  const clearCart = useCartStore((state) => state.clearCart);
  const addItem = useCartStore((state) => state.addItem);

  // Fetch orders directly from Supabase
  const fetchOrders = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setOrders([]);
        setIsLoading(false);
        return;
      }

      const { data: ordersData, error } = await supabase
        .from("orders")
        .select(
          `
          id,
          status,
          total_cents,
          delivery_window_start,
          placed_at,
          order_items (quantity)
        `
        )
        .eq("user_id", user.id)
        .order("placed_at", { ascending: false })
        .returns<OrderRow[]>();

      if (error) {
        throw error;
      }

      // Transform orders data
      const transformedOrders = (ordersData || []).map((order) => ({
        id: order.id,
        status: order.status,
        totalCents: order.total_cents,
        deliveryWindowStart: order.delivery_window_start,
        placedAt: order.placed_at,
        itemCount: order.order_items.reduce(
          (sum, item) => sum + item.quantity,
          0
        ),
      }));

      setOrders(transformedOrders);
    } catch (error) {
      toast({
        message:
          error instanceof Error ? error.message : "Failed to load orders",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle reorder
  const handleReorder = async (orderId: string) => {
    setReorderingId(orderId);
    try {
      const response = await fetch(`/api/account/orders/${orderId}/reorder`, {
        method: "POST",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to reorder");
      }

      const { cartItems, warnings } = result.data as {
        cartItems: ReorderCartItem[];
        warnings: ReorderWarning[];
      };

      // Clear existing cart and add reorder items
      clearCart();

      cartItems.forEach((item: ReorderCartItem) => {
        addItem({
          menuItemId: item.menuItemId,
          menuItemSlug: item.menuItemId, // Use ID as slug for reorders
          nameEn: item.name,
          nameMy: null,
          imageUrl: null,
          basePriceCents: item.priceCents,
          quantity: item.quantity,
          modifiers: item.modifiers.map((mod) => ({
            groupId: mod.optionId || "",
            groupName: mod.name,
            optionId: mod.optionId || "",
            optionName: mod.name,
            priceDeltaCents: mod.priceDeltaCents,
          })),
          notes: item.specialInstructions || "",
        });
      });

      // Show warnings if any
      if (warnings && warnings.length > 0) {
        toast({
          message: `${warnings.length} item(s) had issues - check your cart`,
          type: "warning",
        });
      } else {
        toast({ message: "Items added to cart", type: "success" });
      }

      router.push("/cart");
    } catch (error) {
      toast({
        message: error instanceof Error ? error.message : "Failed to reorder",
        type: "error",
      });
    } finally {
      setReorderingId(null);
    }
  };

  // Open cancel dialog
  const openCancelDialog = (orderId: string) => {
    setOrderToCancel(orderId);
    setCancelReason("");
    setCancelDialogOpen(true);
  };

  // Handle cancel
  const handleCancel = async () => {
    if (!orderToCancel || !cancelReason.trim()) return;

    setCancellingId(orderToCancel);
    try {
      const response = await fetch(
        `/api/account/orders/${orderToCancel}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: cancelReason.trim() }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to cancel order");
      }

      toast({ message: "Order cancelled successfully", type: "success" });
      setCancelDialogOpen(false);
      setOrderToCancel(null);

      // Refresh orders list
      fetchOrders();
    } catch (error) {
      toast({
        message:
          error instanceof Error ? error.message : "Failed to cancel order",
        type: "error",
      });
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <motion.div
        initial={shouldAnimate ? { opacity: 0 } : undefined}
        animate={shouldAnimate ? { opacity: 1 } : undefined}
        className="text-center py-16"
      >
        <div className="rounded-full bg-surface-tertiary w-20 h-20 mx-auto flex items-center justify-center mb-6">
          <ShoppingBag className="h-10 w-10 text-text-muted" />
        </div>
        <h2 className="text-xl font-display font-bold text-text-primary mb-2">
          No orders yet
        </h2>
        <p className="font-body text-text-secondary mb-8">
          When you place an order, it will appear here.
        </p>
        <Button asChild variant="primary" size="lg" className="shadow-elevated">
          <Link href="/menu">Browse Menu</Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0 } : undefined}
      animate={shouldAnimate ? { opacity: 1 } : undefined}
    >
      <div className="space-y-4">
        {orders.map((order, index) => (
          <motion.div
            key={order.id}
            initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="shadow-card hover:shadow-card-hover transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Order Info */}
                  <Link
                    href={`/orders/${order.id}`}
                    className="flex items-start gap-4 flex-1 min-w-0 group"
                  >
                    <div className="rounded-full bg-curry/10 p-2 flex-shrink-0">
                      <Package className="h-5 w-5 text-curry" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-text-primary group-hover:text-primary transition-colors">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {order.itemCount} item{order.itemCount !== 1 ? "s" : ""}{" "}
                        &middot; {format(parseISO(order.placedAt), "MMM d, yyyy")}
                      </p>
                      {order.deliveryWindowStart && (
                        <p className="text-sm text-text-secondary">
                          Delivery:{" "}
                          {format(
                            parseISO(order.deliveryWindowStart),
                            "EEEE, MMM d"
                          )}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-text-muted flex-shrink-0 group-hover:text-primary transition-colors" />
                  </Link>

                  {/* Price & Status */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-medium text-text-primary">
                      {formatPrice(order.totalCents)}
                    </p>
                    <Badge className={STATUS_COLORS[order.status]}>
                      {STATUS_LABELS[order.status]}
                    </Badge>
                    {order.status === "pending" && (
                      <p className="text-xs text-amber-600 flex items-center justify-end gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        Action required
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  {/* Reorder Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReorder(order.id)}
                    disabled={reorderingId === order.id}
                    className="flex-1 sm:flex-none"
                  >
                    {reorderingId === order.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCcw className="h-4 w-4 mr-2" />
                    )}
                    Reorder
                  </Button>

                  {/* Cancel Button - Only for pending/confirmed */}
                  {CANCELLABLE_STATUSES.includes(order.status) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openCancelDialog(order.id)}
                      disabled={cancellingId === order.id}
                      className="text-status-error hover:text-status-error hover:bg-status-error/10"
                    >
                      {cancellingId === order.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <X className="h-4 w-4 mr-2" />
                      )}
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this order. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label
              htmlFor="cancelReason"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              Cancellation Reason
            </label>
            <Input
              id="cancelReason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g., Changed my mind, ordered by mistake..."
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setCancelDialogOpen(false);
                setOrderToCancel(null);
              }}
            >
              Keep Order
            </Button>
            <Button
              variant="danger"
              onClick={handleCancel}
              disabled={!cancelReason.trim() || cancellingId !== null}
              isLoading={cancellingId !== null}
            >
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
