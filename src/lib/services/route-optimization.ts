/**
 * Route Optimization Service
 * Integrates with Google Routes API to optimize delivery routes
 */

import type { AddressesRow } from "@/types/database";

// Kitchen origin coordinates
const KITCHEN_ORIGIN = {
  latitude: 34.0894,
  longitude: -117.8897,
  address: "750 Terrado Plaza, Suite 33, Covina, CA 91723",
};

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
}

export interface OptimizationError {
  code: string;
  message: string;
  stopId?: string;
}

/**
 * Validates that all stops have valid coordinates
 */
export function validateStopsForOptimization(
  stops: RoutableStop[]
): { valid: boolean; errors: OptimizationError[] } {
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

/**
 * Optimizes a route using Google Routes Optimization API
 * Falls back to nearest-neighbor algorithm if API is unavailable
 */
export async function optimizeRoute(
  stops: RoutableStop[],
  options?: {
    departureTime?: Date;
    returnToOrigin?: boolean;
  }
): Promise<OptimizedRoute> {
  // Validate stops first
  const validation = validateStopsForOptimization(stops);
  if (!validation.valid) {
    throw new Error(
      `Invalid stops: ${validation.errors.map((e) => e.message).join("; ")}`
    );
  }

  // If only one stop, no optimization needed
  if (stops.length === 1) {
    return {
      orderedStops: [
        {
          stopId: stops[0].stopId,
          stopIndex: 0,
          eta: null,
          distanceMeters: 0,
          durationSeconds: 0,
        },
      ],
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
      optimizedPolyline: null,
    };
  }

  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;

  // Try Google Routes API first
  if (googleApiKey) {
    try {
      return await optimizeWithGoogleRoutes(stops, options);
    } catch (error) {
      console.warn("Google Routes API failed, falling back to nearest-neighbor:", error);
    }
  }

  // Fall back to nearest-neighbor algorithm
  return optimizeWithNearestNeighbor(stops);
}

/**
 * Optimizes route using Google Routes Optimization API
 */
async function optimizeWithGoogleRoutes(
  stops: RoutableStop[],
  options?: {
    departureTime?: Date;
    returnToOrigin?: boolean;
  }
): Promise<OptimizedRoute> {
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!googleApiKey) {
    throw new Error("Google Maps API key is not configured");
  }

  // Add time windows if delivery windows are specified
  const intermediates = stops.map((stop) => {
    const waypoint: Record<string, unknown> = {
      location: {
        latLng: {
          latitude: stop.address.lat,
          longitude: stop.address.lng,
        },
      },
    };

    // Add time window constraint if available
    if (stop.deliveryWindowStart && stop.deliveryWindowEnd) {
      waypoint.arrivalTimeWindow = {
        startTime: new Date(stop.deliveryWindowStart).toISOString(),
        endTime: new Date(stop.deliveryWindowEnd).toISOString(),
      };
    }

    return waypoint;
  });

  const requestBody = {
    origin: {
      location: {
        latLng: {
          latitude: KITCHEN_ORIGIN.latitude,
          longitude: KITCHEN_ORIGIN.longitude,
        },
      },
    },
    destination: options?.returnToOrigin
      ? {
          location: {
            latLng: {
              latitude: KITCHEN_ORIGIN.latitude,
              longitude: KITCHEN_ORIGIN.longitude,
            },
          },
        }
      : {
          location: {
            latLng: {
              latitude: stops[stops.length - 1].address.lat,
              longitude: stops[stops.length - 1].address.lng,
            },
          },
        },
    intermediates: intermediates.slice(0, -1), // Exclude destination if not returning
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_AWARE",
    departureTime: (options?.departureTime || new Date()).toISOString(),
    optimizeWaypointOrder: true,
    languageCode: "en-US",
    units: "IMPERIAL",
  };

  const response = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": googleApiKey,
        "X-Goog-FieldMask": "routes.optimizedIntermediateWaypointIndex,routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.duration,routes.legs.distanceMeters",
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Google Routes API error: ${error.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  const route = data.routes?.[0];

  if (!route) {
    throw new Error("No route returned from Google Routes API");
  }

  // Get optimized order from response
  const optimizedOrder = route.optimizedIntermediateWaypointIndex ||
    stops.map((_, i) => i);

  // Build ordered stops with ETAs
  let cumulativeDuration = 0;
  const departureTime = options?.departureTime || new Date();

  const orderedStops = optimizedOrder.map((originalIndex: number, newIndex: number) => {
    const stop = stops[originalIndex];
    const leg = route.legs?.[newIndex];

    const durationSeconds = leg?.duration ? parseInt(leg.duration.replace("s", "")) : 0;
    const distanceMeters = leg?.distanceMeters || 0;

    cumulativeDuration += durationSeconds;

    // Calculate ETA
    const eta = new Date(departureTime.getTime() + cumulativeDuration * 1000);

    return {
      stopId: stop.stopId,
      stopIndex: newIndex,
      eta: eta.toISOString(),
      distanceMeters,
      durationSeconds,
    };
  });

  return {
    orderedStops,
    totalDistanceMeters: route.distanceMeters || 0,
    totalDurationSeconds: route.duration ? parseInt(route.duration.replace("s", "")) : 0,
    optimizedPolyline: route.polyline?.encodedPolyline || null,
  };
}

/**
 * Simple nearest-neighbor optimization algorithm
 * Used as fallback when Google Routes API is unavailable
 */
function optimizeWithNearestNeighbor(stops: RoutableStop[]): OptimizedRoute {
  const remainingStops = [...stops];
  const orderedStops: OptimizedRoute["orderedStops"] = [];

  let currentLat = KITCHEN_ORIGIN.latitude;
  let currentLng = KITCHEN_ORIGIN.longitude;
  let totalDistance = 0;

  while (remainingStops.length > 0) {
    // Find nearest unvisited stop
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    for (let i = 0; i < remainingStops.length; i++) {
      const stop = remainingStops[i];
      const distance = calculateHaversineDistance(
        currentLat,
        currentLng,
        stop.address.lat!,
        stop.address.lng!
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    const nearestStop = remainingStops.splice(nearestIndex, 1)[0];

    orderedStops.push({
      stopId: nearestStop.stopId,
      stopIndex: orderedStops.length,
      eta: null, // Can't calculate accurate ETA without routing API
      distanceMeters: Math.round(nearestDistance * 1000), // Convert km to meters
      durationSeconds: estimateDrivingTime(nearestDistance),
    });

    totalDistance += nearestDistance;
    currentLat = nearestStop.address.lat!;
    currentLng = nearestStop.address.lng!;
  }

  return {
    orderedStops,
    totalDistanceMeters: Math.round(totalDistance * 1000),
    totalDurationSeconds: orderedStops.reduce((sum, s) => sum + s.durationSeconds, 0),
    optimizedPolyline: null,
  };
}

/**
 * Calculate haversine distance between two points in kilometers
 */
function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Estimate driving time based on distance
 * Assumes average speed of 35 mph (56 km/h) for urban delivery
 */
function estimateDrivingTime(distanceKm: number): number {
  const averageSpeedKmH = 56; // 35 mph
  const hours = distanceKm / averageSpeedKmH;
  return Math.round(hours * 3600); // Convert to seconds
}

/**
 * Updates route stops with optimized order and ETAs
 * Returns the ordered stop IDs to update in the database
 */
export async function optimizeRouteStops(
  _routeId: string,
  stops: Array<{
    id: string;
    order_id: string;
    address: Pick<AddressesRow, "lat" | "lng" | "line_1" | "city" | "state" | "postal_code">;
    deliveryWindowStart?: string | null;
    deliveryWindowEnd?: string | null;
  }>,
  departureTime?: Date
): Promise<{
  orderedStopIds: string[];
  polyline: string | null;
  totalDuration: number;
  totalDistance: number;
}> {
  const routableStops: RoutableStop[] = stops.map((stop) => ({
    stopId: stop.id,
    orderId: stop.order_id,
    address: {
      lat: stop.address.lat,
      lng: stop.address.lng,
      line1: stop.address.line_1,
      city: stop.address.city,
      state: stop.address.state,
      postalCode: stop.address.postal_code,
    },
    deliveryWindowStart: stop.deliveryWindowStart,
    deliveryWindowEnd: stop.deliveryWindowEnd,
  }));

  const optimized = await optimizeRoute(routableStops, {
    departureTime,
    returnToOrigin: false,
  });

  return {
    orderedStopIds: optimized.orderedStops.map((s) => s.stopId),
    polyline: optimized.optimizedPolyline,
    totalDuration: optimized.totalDurationSeconds,
    totalDistance: optimized.totalDistanceMeters,
  };
}
