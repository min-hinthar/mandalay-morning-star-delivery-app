import type { OrderStatus } from "@/types/order";
import type { RefundStatus } from "@/types/database";

export interface Order {
  id: string;
  status: OrderStatus;
  refundStatus: RefundStatus;
  totalCents: number;
  deliveryWindowStart: string | null;
  placedAt: string;
  itemCount: number;
}

export interface ReorderCartItem {
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

export interface ReorderWarning {
  menuItemId: string | null;
  itemName: string;
  type: "unavailable" | "sold_out" | "price_changed";
  message: string;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending Payment",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-blue-100 text-blue-800",
  out_for_delivery: "bg-amber-100 text-amber-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export const CANCELLABLE_STATUSES: OrderStatus[] = ["pending", "confirmed"];

export interface OrderRow {
  id: string;
  status: OrderStatus;
  refund_status: RefundStatus;
  total_cents: number;
  delivery_window_start: string | null;
  placed_at: string;
  order_items: Array<{ quantity: number }>;
}
