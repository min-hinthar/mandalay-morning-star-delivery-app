import type { OrderStatus } from "@/types/database";

/** Browser tab title per order status, so a backgrounded tab still reports progress. */
export const STATUS_TITLES: Record<OrderStatus, string> = {
  pending_approval: "Awaiting Approval | Morning Star",
  pending: "Order Placed | Morning Star",
  confirmed: "Confirmed | Morning Star",
  preparing: "Preparing... | Morning Star",
  out_for_delivery: "Out for Delivery | Morning Star",
  delivered: "Delivered! | Morning Star",
  cancelled: "Cancelled | Morning Star",
};
