import type { OrderStatus as DBOrderStatus } from "./database";

export type OrderStatus = DBOrderStatus;

export interface OrderItem {
  id: string;
  nameSnapshot: string;
  basePriceSnapshot: number;
  quantity: number;
  lineTotalCents: number;
  specialInstructions: string | null;
  modifiers: OrderItemModifier[];
}

export interface OrderItemModifier {
  id: string;
  nameSnapshot: string;
  priceDeltaSnapshot: number;
}

export interface OrderAddress {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  formattedAddress: string | null;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  subtotalCents: number;
  deliveryFeeCents: number;
  taxCents: number;
  totalCents: number;
  deliveryWindowStart: string | null;
  deliveryWindowEnd: string | null;
  specialInstructions: string | null;
  stripePaymentIntentId: string | null;
  placedAt: string;
  confirmedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  address?: OrderAddress | null;
  items?: OrderItem[];
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending Payment",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  out_for_delivery: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};
