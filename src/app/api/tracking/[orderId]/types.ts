export interface OrderItemModifierData {
  name_snapshot: string;
}

export interface OrderItemData {
  id: string;
  name_snapshot: string;
  quantity: number;
  order_item_modifiers: OrderItemModifierData[];
}

export interface AddressData {
  line_1: string;
  line_2: string | null;
  city: string;
  state: string;
  postal_code: string;
  lat: number | null;
  lng: number | null;
}

export interface OrderQueryResult {
  id: string;
  user_id: string;
  status: string;
  placed_at: string;
  confirmed_at: string | null;
  delivered_at: string | null;
  // No cancelled_at / cancellation_reason: `orders` has neither column, and
  // declaring them here is what let the select naming them type-check. The
  // sibling OrderRow in fetchTrackingData.ts drops them for the same reason.
  delivery_window_start: string | null;
  delivery_window_end: string | null;
  special_instructions: string | null;
  subtotal_cents: number;
  delivery_fee_cents: number;
  tax_cents: number;
  tip_cents: number;
  discount_cents: number;
  total_cents: number;
  share_token: string | null;
  addresses: AddressData | null;
  order_items: OrderItemData[];
}

// Route / driver / location row shapes live with their only reader,
// src/lib/tracking/route-tracking.ts.
