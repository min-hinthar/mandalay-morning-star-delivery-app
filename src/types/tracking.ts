/**
 * V2 Sprint 3: Customer Tracking Types
 * Types for order tracking page, real-time updates, and ETA calculation
 */

import type { OrderStatus } from "./database";
import type {
  RouteStopStatus,
  VehicleType,
  EtaInfo,
  StopInfo,
  TrackingDriverInfo,
  DriverLocation,
} from "./driver";

// ===========================================
// TRACKING API RESPONSE TYPES
// ===========================================

/**
 * Full tracking data returned by GET /api/tracking/{orderId}
 */
export interface TrackingData {
  order: TrackingOrderInfo;
  routeStop: TrackingRouteStopInfo | null;
  driver: TrackingDriverInfo | null;
  driverLocation: DriverLocation | null;
  eta: EtaInfo | null;
}

/**
 * Order information for tracking page
 */
export interface TrackingOrderInfo {
  id: string;
  status: OrderStatus;
  placedAt: string;
  confirmedAt: string | null;
  deliveredAt: string | null;
  deliveryWindowStart: string | null;
  deliveryWindowEnd: string | null;
  specialInstructions: string | null;
  address: TrackingAddressInfo;
  items: TrackingOrderItem[];
  subtotalCents: number;
  deliveryFeeCents: number;
  taxCents: number;
  totalCents: number;
}

/**
 * Address information for tracking map
 */
export interface TrackingAddressInfo {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  lat: number | null;
  lng: number | null;
}

/**
 * Order item for tracking summary
 */
export interface TrackingOrderItem {
  id: string;
  name: string;
  quantity: number;
  modifiers: string[];
}

/**
 * Route stop information for tracking
 */
export interface TrackingRouteStopInfo extends StopInfo {
  id: string;
  stopIndex: number;
  totalStops: number;
  status: RouteStopStatus;
  eta: string | null;
  deliveryPhotoUrl: string | null;
}

/**
 * Extended driver info for tracking page with vehicle details
 */
export interface TrackingDriverDetails extends TrackingDriverInfo {
  vehicleType: VehicleType | null;
}

// ===========================================
// REALTIME SUBSCRIPTION TYPES
// ===========================================

/**
 * Order update from Supabase Realtime
 */
export interface RealtimeOrderUpdate {
  id: string;
  status: OrderStatus;
  confirmed_at: string | null;
  delivered_at: string | null;
}

/**
 * Route stop update from Supabase Realtime
 */
export interface RealtimeRouteStopUpdate {
  id: string;
  status: RouteStopStatus;
  eta: string | null;
  stop_index: number;
  arrived_at: string | null;
  delivered_at: string | null;
  delivery_photo_url: string | null;
}

/**
 * Location update from Supabase Realtime
 */
export interface RealtimeLocationUpdate {
  id: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  accuracy: number | null;
  recorded_at: string;
}

/**
 * State returned by useTrackingSubscription hook
 */
export interface TrackingSubscriptionState {
  isConnected: boolean;
  connectionError: string | null;
  orderStatus: OrderStatus | null;
  stopStatus: RouteStopStatus | null;
  driverLocation: DriverLocation | null;
  stopEta: string | null;
  deliveryPhotoUrl: string | null;
  lastUpdate: Date | null;
}

// ===========================================
// ETA CALCULATION TYPES
// ===========================================

/**
 * Input for ETA calculation
 */
export interface ETACalculationInput {
  driverLocation: LatLng;
  customerLocation: LatLng;
  remainingStops: number;
  avgStopDurationMinutes?: number;
}

/**
 * Result of ETA calculation
 */
export interface ETAResult {
  minMinutes: number;
  maxMinutes: number;
  estimatedArrival: Date;
}

/**
 * Simple lat/lng coordinate pair
 */
export interface LatLng {
  lat: number;
  lng: number;
}

// ===========================================
// COMPONENT PROPS TYPES
// ===========================================

/**
 * Props for StatusTimeline component
 */
export interface StatusTimelineProps {
  currentStatus: OrderStatus;
  placedAt: string;
  confirmedAt: string | null;
  deliveredAt: string | null;
  isLive?: boolean;
}

/**
 * Props for ETADisplay component
 */
export interface ETADisplayProps {
  minMinutes: number;
  maxMinutes: number;
  estimatedArrival: string;
  isCalculating?: boolean;
}

/**
 * Props for DeliveryMap component
 */
export interface DeliveryMapProps {
  customerLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  driverLocation: {
    lat: number;
    lng: number;
    heading: number | null;
  } | null;
  routePolyline?: string | null;
  isLive?: boolean;
}

/**
 * Props for DriverCard component
 */
export interface DriverCardProps {
  driver: {
    fullName: string | null;
    profileImageUrl: string | null;
    phone: string | null;
    vehicleType: VehicleType | null;
  };
  stopProgress: {
    currentStop: number;
    totalStops: number;
  };
  onContactDriver?: () => void;
}

/**
 * Props for OrderSummary component
 */
export interface OrderSummaryProps {
  items: TrackingOrderItem[];
  subtotalCents: number;
  deliveryFeeCents: number;
  taxCents: number;
  totalCents: number;
  deliveryWindow: {
    start: string | null;
    end: string | null;
  };
  defaultExpanded?: boolean;
}

/**
 * Props for SupportActions component
 */
export interface SupportActionsProps {
  driverPhone: string | null;
  orderStatus: OrderStatus;
  onContactSupport?: () => void;
}

/**
 * Props for TrackingPageClient component
 */
export interface TrackingPageClientProps {
  orderId: string;
  initialData: TrackingData;
}

// ===========================================
// API ERROR TYPES
// ===========================================

export interface TrackingApiError {
  code: "NOT_FOUND" | "UNAUTHORIZED" | "FORBIDDEN" | "INTERNAL_ERROR";
  message: string;
}

// Re-export types from driver.ts for convenience
export type {
  EtaInfo,
  StopInfo,
  TrackingDriverInfo,
  DriverLocation,
  RouteStopStatus,
  VehicleType,
};
