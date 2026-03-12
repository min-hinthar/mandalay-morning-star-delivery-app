/**
 * Route Optimization - Types & Validation
 */

import type { AddressesRow } from "@/types/database";

export interface RoutableStop {
  stopId: string;
  orderId: string;
  address: {
    lat: number | null;
    lng: number | null;
    line1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  deliveryWindowStart?: string | null;
  deliveryWindowEnd?: string | null;
}

export interface TimeWindowViolation {
  stopId: string;
  orderId: string;
  eta: string;
  windowEnd: string;
  minutesLate: number;
}

export interface OptimizedRoute {
  orderedStops: Array<{
    stopId: string;
    stopIndex: number;
    eta: string | null;
    distanceMeters: number;
    durationSeconds: number;
  }>;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  optimizedPolyline: string | null;
  method: "google" | "nearest-neighbor" | "single-stop";
  timeWindowViolations: TimeWindowViolation[];
}

export interface OptimizationError {
  code: string;
  message: string;
  stopId?: string;
}

export interface OptimizeRouteStopsInput {
  id: string;
  order_id: string;
  address: Pick<AddressesRow, "lat" | "lng" | "line_1" | "city" | "state" | "postal_code">;
  deliveryWindowStart?: string | null;
  deliveryWindowEnd?: string | null;
}

/**
 * Validates that all stops have valid coordinates
 */
export function validateStopsForOptimization(stops: RoutableStop[]): {
  valid: boolean;
  errors: OptimizationError[];
} {
  const errors: OptimizationError[] = [];

  for (const stop of stops) {
    if (stop.address.lat === null || stop.address.lng === null) {
      errors.push({
        code: "MISSING_COORDINATES",
        message: `Stop ${stop.stopId} is missing coordinates. Please geocode the address first.`,
        stopId: stop.stopId,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
