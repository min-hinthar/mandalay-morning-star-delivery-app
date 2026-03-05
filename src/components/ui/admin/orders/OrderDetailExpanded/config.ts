import type { OrderStatus } from "@/types/database";

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-secondary-light text-secondary-hover",
  confirmed: "bg-accent-teal/10 text-accent-teal",
  preparing: "bg-accent-magenta/10 text-accent-magenta",
  out_for_delivery: "bg-primary/10 text-primary",
  delivered: "bg-green/10 text-green",
  cancelled: "bg-status-error/10 text-status-error",
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const NEXT_STATUSES: Record<OrderStatus, { status: OrderStatus; label: string }[]> = {
  pending: [
    { status: "confirmed", label: "Confirm Order" },
    { status: "cancelled", label: "Cancel" },
  ],
  confirmed: [
    { status: "preparing", label: "Start Preparing" },
    { status: "pending", label: "Revert to Pending" },
    { status: "cancelled", label: "Cancel" },
  ],
  preparing: [
    { status: "out_for_delivery", label: "Send Out" },
    { status: "confirmed", label: "Revert to Confirmed" },
    { status: "cancelled", label: "Cancel" },
  ],
  out_for_delivery: [
    { status: "delivered", label: "Mark Delivered" },
    { status: "preparing", label: "Revert to Preparing" },
  ],
  delivered: [{ status: "out_for_delivery", label: "Revert to Out for Delivery" }],
  cancelled: [{ status: "pending", label: "Reopen Order" }],
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  status_change: "Status Changed",
  cancel: "Order Cancelled",
  refund: "Refund Processed",
  edit: "Order Edited",
  update_items: "Items Updated",
  assign_driver: "Driver Assigned",
  unassign_driver: "Driver Unassigned",
};
