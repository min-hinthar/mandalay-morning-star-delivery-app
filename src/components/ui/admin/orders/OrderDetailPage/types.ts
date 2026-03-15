import type { OrderStatus } from "@/types/database";

export interface OrderDetailItemModifier {
  name: string;
  priceDelta: number;
}

export interface OrderDetailItem {
  id: string;
  name: string;
  nameMy: string | null;
  quantity: number;
  basePrice: number;
  lineTotal: number;
  refundedQuantity: number;
  specialInstructions: string | null;
  modifiers: OrderDetailItemModifier[];
}

export interface OrderDetailAddress {
  street: string;
  apt: string | null;
  city: string;
  state: string;
  zip: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actorRole: string;
  reason: string | null;
  createdAt: string;
}

export interface DeliveryInfo {
  deliveryNotes: string | null;
  deliveryInstructions: string | null;
  arrivedAt: string | null;
  deliveredAt: string | null;
  routeId: string | null;
  routeStatus: string | null;
}

export interface OrderDetail {
  id: string;
  status: OrderStatus;
  customerName: string | null;
  customerEmail: string;
  customerPhone: string | null;
  address: OrderDetailAddress | null;
  items: OrderDetailItem[];
  subtotalCents: number;
  deliveryFeeCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
  discountCents: number;
  specialInstructions: string | null;
  deliveryInfo: DeliveryInfo | null;
  placedAt: string;
  confirmedAt: string | null;
  deliveredAt: string | null;
  deliveryWindowStart: string | null;
  deliveryWindowEnd: string | null;
  stripePaymentIntentId: string | null;
  paymentMethod: "stripe" | "cod";
  codApprovedAt: string | null;
  isPriority: boolean;
  assignedDriverId: string | null;
  assignedDriverName: string | null;
  emailStatus: "delivered" | "failed" | "pending" | "sent" | "bounced" | "opened" | null;
  needsContact: boolean;
  auditLog: AuditLogEntry[];
}
