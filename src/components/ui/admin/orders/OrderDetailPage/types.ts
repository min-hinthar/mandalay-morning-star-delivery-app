import type { OrderStatus } from "@/types/database";

export interface OrderDetailItem {
  id: string;
  name: string;
  quantity: number;
  basePrice: number;
  lineTotal: number;
  refundedQuantity: number;
  specialInstructions: string | null;
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
  totalCents: number;
  discountCents: number;
  specialInstructions: string | null;
  placedAt: string;
  confirmedAt: string | null;
  deliveredAt: string | null;
  deliveryWindowStart: string | null;
  deliveryWindowEnd: string | null;
  stripePaymentIntentId: string | null;
  isPriority: boolean;
  assignedDriverId: string | null;
  assignedDriverName: string | null;
  emailStatus: "delivered" | "failed" | "pending" | "sent" | "bounced" | "opened" | null;
  needsContact: boolean;
  auditLog: AuditLogEntry[];
}
