/**
 * V2 Driver Operations Types
 * Types for driver management, routes, tracking, and delivery operations
 */

import type { OrdersRow, AddressesRow, ProfilesRow } from "./database";

// ===========================================
// ENUMS
// ===========================================

export type RouteStatus = "planned" | "in_progress" | "completed";

export type RouteStopStatus =
  | "pending"
  | "enroute"
  | "arrived"
  | "delivered"
  | "skipped";

export type VehicleType = "car" | "motorcycle" | "bicycle" | "van" | "truck";

export type DeliveryExceptionType =
  | "customer_not_home"
  | "wrong_address"
  | "access_issue"
  | "refused_delivery"
  | "damaged_order"
  | "other";

// ===========================================
// DRIVERS
// ===========================================

export interface DriversRow {
  id: string;
  user_id: string;
  vehicle_type: VehicleType | null;
  license_plate: string | null;
  phone: string | null;
  profile_image_url: string | null;
  is_active: boolean;
  onboarding_completed_at: string | null;
  rating_avg: number;
  deliveries_count: number;
  created_at: string;
  updated_at: string;
}

export interface DriversInsert {
  id?: string;
  user_id: string;
  vehicle_type?: VehicleType | null;
  license_plate?: string | null;
  phone?: string | null;
  profile_image_url?: string | null;
  is_active?: boolean;
  onboarding_completed_at?: string | null;
  rating_avg?: number;
  deliveries_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DriversUpdate {
  id?: string;
  user_id?: string;
  vehicle_type?: VehicleType | null;
  license_plate?: string | null;
  phone?: string | null;
  profile_image_url?: string | null;
  is_active?: boolean;
  onboarding_completed_at?: string | null;
  rating_avg?: number;
  deliveries_count?: number;
  created_at?: string;
  updated_at?: string;
}

// Driver with joined profile data
export interface DriverWithProfile extends DriversRow {
  profile: Pick<ProfilesRow, "id" | "email" | "full_name" | "phone">;
}

// ===========================================
// ROUTES
// ===========================================

export interface RouteStats {
  total_stops: number;
  pending_stops: number;
  delivered_stops: number;
  skipped_stops: number;
  completion_rate: number;
  total_distance_miles?: number;
  total_duration_minutes?: number;
}

export interface RoutesRow {
  id: string;
  delivery_date: string;
  driver_id: string | null;
  status: RouteStatus;
  optimized_polyline: string | null;
  stats_json: RouteStats | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoutesInsert {
  id?: string;
  delivery_date: string;
  driver_id?: string | null;
  status?: RouteStatus;
  optimized_polyline?: string | null;
  stats_json?: RouteStats | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RoutesUpdate {
  id?: string;
  delivery_date?: string;
  driver_id?: string | null;
  status?: RouteStatus;
  optimized_polyline?: string | null;
  stats_json?: RouteStats | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Route with driver and stops
export interface RouteWithDetails extends RoutesRow {
  driver: DriverWithProfile | null;
  stops: RouteStopWithOrder[];
}

// ===========================================
// ROUTE STOPS
// ===========================================

export interface RouteStopsRow {
  id: string;
  route_id: string;
  order_id: string;
  stop_index: number;
  eta: string | null;
  status: RouteStopStatus;
  arrived_at: string | null;
  delivered_at: string | null;
  delivery_photo_url: string | null;
  delivery_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RouteStopsInsert {
  id?: string;
  route_id: string;
  order_id: string;
  stop_index: number;
  eta?: string | null;
  status?: RouteStopStatus;
  arrived_at?: string | null;
  delivered_at?: string | null;
  delivery_photo_url?: string | null;
  delivery_notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RouteStopsUpdate {
  id?: string;
  route_id?: string;
  order_id?: string;
  stop_index?: number;
  eta?: string | null;
  status?: RouteStopStatus;
  arrived_at?: string | null;
  delivered_at?: string | null;
  delivery_photo_url?: string | null;
  delivery_notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Stop with order details
export interface RouteStopWithOrder extends RouteStopsRow {
  order: OrderWithAddress;
}

// Order with address for stop display
export interface OrderWithAddress extends Pick<
  OrdersRow,
  | "id"
  | "user_id"
  | "status"
  | "total_cents"
  | "delivery_window_start"
  | "delivery_window_end"
  | "special_instructions"
> {
  address: Pick<
    AddressesRow,
    "id" | "label" | "line_1" | "line_2" | "city" | "state" | "postal_code" | "lat" | "lng"
  > | null;
  customer: Pick<ProfilesRow, "id" | "full_name" | "phone" | "email"> | null;
  item_count: number;
}

// ===========================================
// LOCATION UPDATES
// ===========================================

export interface LocationUpdatesRow {
  id: string;
  driver_id: string;
  route_id: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  recorded_at: string;
  source: string;
  created_at: string;
}

export interface LocationUpdatesInsert {
  id?: string;
  driver_id: string;
  route_id?: string | null;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  recorded_at?: string;
  source?: string;
  created_at?: string;
}

export interface LocationUpdatesUpdate {
  id?: string;
  driver_id?: string;
  route_id?: string | null;
  latitude?: number;
  longitude?: number;
  accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  recorded_at?: string;
  source?: string;
  created_at?: string;
}

// Simplified location for display
export interface DriverLocation {
  latitude: number;
  longitude: number;
  recorded_at: string;
  accuracy: number | null;
  heading: number | null;
}

// ===========================================
// DELIVERY EXCEPTIONS
// ===========================================

export interface DeliveryExceptionsRow {
  id: string;
  route_stop_id: string;
  exception_type: DeliveryExceptionType;
  description: string | null;
  photo_url: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  created_at: string;
}

export interface DeliveryExceptionsInsert {
  id?: string;
  route_stop_id: string;
  exception_type: DeliveryExceptionType;
  description?: string | null;
  photo_url?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
  resolution_notes?: string | null;
  created_at?: string;
}

export interface DeliveryExceptionsUpdate {
  id?: string;
  route_stop_id?: string;
  exception_type?: DeliveryExceptionType;
  description?: string | null;
  photo_url?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
  resolution_notes?: string | null;
  created_at?: string;
}

// Exception with stop details
export interface DeliveryExceptionWithDetails extends DeliveryExceptionsRow {
  route_stop: RouteStopWithOrder;
  resolver?: Pick<ProfilesRow, "id" | "full_name" | "email"> | null;
}

// ===========================================
// API REQUEST/RESPONSE TYPES
// ===========================================

// Driver list item for admin dashboard
export interface DriverListItem {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  vehicleType: VehicleType | null;
  licensePlate: string | null;
  profileImageUrl: string | null;
  isActive: boolean;
  onboardingCompletedAt: string | null;
  ratingAvg: number;
  deliveriesCount: number;
  createdAt: string;
}

// Route list item for admin dashboard
export interface RouteListItem {
  id: string;
  deliveryDate: string;
  driver: {
    id: string;
    fullName: string | null;
    profileImageUrl: string | null;
  } | null;
  status: RouteStatus;
  stopCount: number;
  deliveredCount: number;
  completionRate: number;
  createdAt: string;
}

// Route detail for admin/driver view
export interface RouteDetail {
  id: string;
  deliveryDate: string;
  driver: DriverListItem | null;
  status: RouteStatus;
  optimizedPolyline: string | null;
  stats: RouteStats | null;
  stops: StopDetail[];
  startedAt: string | null;
  completedAt: string | null;
}

// Stop detail for route view
export interface StopDetail {
  id: string;
  stopIndex: number;
  eta: string | null;
  status: RouteStopStatus;
  arrivedAt: string | null;
  deliveredAt: string | null;
  deliveryPhotoUrl: string | null;
  deliveryNotes: string | null;
  order: {
    id: string;
    totalCents: number;
    deliveryWindowStart: string | null;
    deliveryWindowEnd: string | null;
    specialInstructions: string | null;
    itemCount: number;
    customer: {
      id: string;
      fullName: string | null;
      phone: string | null;
    };
    address: {
      line1: string;
      line2: string | null;
      city: string;
      state: string;
      postalCode: string;
      lat: number | null;
      lng: number | null;
    };
  };
  exception: {
    id: string;
    type: DeliveryExceptionType;
    description: string | null;
    photoUrl: string | null;
    resolved: boolean;
  } | null;
}

// ===========================================
// TRACKING TYPES (Customer-facing)
// ===========================================

export interface TrackingInfo {
  orderId: string;
  status: string;
  timeline: TrackingTimelineEvent[];
  driver: TrackingDriverInfo | null;
  location: DriverLocation | null;
  eta: EtaInfo | null;
  stopInfo: StopInfo | null;
}

export interface TrackingTimelineEvent {
  status: string;
  label: string;
  timestamp: string | null;
  isCurrent: boolean;
  isComplete: boolean;
}

export interface TrackingDriverInfo {
  id: string;
  fullName: string | null;
  profileImageUrl: string | null;
  phone: string | null;
}

export interface EtaInfo {
  minMinutes: number;
  maxMinutes: number;
  estimatedArrival: string;
}

export interface StopInfo {
  currentStop: number;
  totalStops: number;
}

// ===========================================
// ROUTE OPTIMIZATION TYPES
// ===========================================

export interface OptimizationRequest {
  routeId: string;
  originAddress: string;
  stops: {
    orderId: string;
    address: string;
    lat: number;
    lng: number;
    timeWindowStart?: string;
    timeWindowEnd?: string;
  }[];
}

export interface OptimizationResult {
  success: boolean;
  optimizedOrder: string[]; // order IDs in optimized sequence
  polyline: string;
  totalDistanceMiles: number;
  totalDurationMinutes: number;
  stopEtas: {
    orderId: string;
    eta: string;
    durationFromPrevious: number;
  }[];
}
