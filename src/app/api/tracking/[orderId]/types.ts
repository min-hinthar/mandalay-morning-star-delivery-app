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
  cancelled_at: string | null;
  cancellation_reason: string | null;
  delivery_window_start: string | null;
  delivery_window_end: string | null;
  special_instructions: string | null;
  subtotal_cents: number;
  delivery_fee_cents: number;
  tax_cents: number;
  total_cents: number;
  addresses: AddressData | null;
  order_items: OrderItemData[];
}

export interface RouteData {
  id: string;
  status: string;
  driver_id: string | null;
}

export interface DriverProfileData {
  full_name: string | null;
  phone: string | null;
}

export interface DriverData {
  id: string;
  profile_image_url: string | null;
  vehicle_type: string | null;
  profiles: DriverProfileData | null;
}

export interface RouteStopQueryResult {
  id: string;
  stop_index: number;
  status: string;
  eta: string | null;
  delivery_photo_url: string | null;
  routes: RouteData | null;
}

export interface LocationUpdateData {
  latitude: number;
  longitude: number;
  recorded_at: string;
  accuracy: number | null;
  heading: number | null;
}

export interface CurrentStopData {
  stop_index: number;
}
