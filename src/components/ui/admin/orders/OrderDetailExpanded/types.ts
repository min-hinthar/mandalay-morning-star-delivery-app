import type { OrderStatus } from "@/types/database";

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  basePrice: number;
  lineTotal: number;
  refundedQuantity: number;
  specialInstructions: string | null;
}

export interface OrderAddress {
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

export interface Driver {
  id: string;
  fullName: string | null;
  email: string;
  phone: string | null;
  vehicleType: string | null;
  isActive: boolean;
}

export interface OrderDetail {
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

export interface OrderDetailExpandedProps {
  orderId: string;
  onUpdate: () => void;
}
