/**
 * StatusTimeline Constants
 */

import React from "react";
import {
  Clock,
  CheckCircle,
  Package,
  Truck,
  Home,
  XCircle,
} from "lucide-react";
import type { OrderStatus } from "@/types/database";

export const STATUS_ORDER: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
];

export const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; icon: React.FC<{ className?: string }>; color: string }
> = {
  pending: { label: "Order Placed", icon: Clock, color: "v6-secondary" },
  confirmed: { label: "Payment Confirmed", icon: CheckCircle, color: "v6-primary" },
  preparing: { label: "Preparing Your Food", icon: Package, color: "v6-primary" },
  out_for_delivery: { label: "Out for Delivery", icon: Truck, color: "v6-secondary" },
  delivered: { label: "Delivered", icon: Home, color: "v6-green" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "v6-status-error" },
};
