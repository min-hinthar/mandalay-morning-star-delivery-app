/**
 * Route Optimization - Optimization Algorithms
 * Google Routes API integration and nearest-neighbor fallback
 */

import { logger } from "@/lib/utils/logger";
import type { RoutableStop, OptimizedRoute, OptimizeRouteStopsInput } from "./types";
import { KITCHEN_COORDS } from "@/lib/constants/kitchen";
import { validateStopsForOptimization } from "./types";

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
    throw new Error(`Invalid stops: ${validation.errors.map((e) => e.message).join("; ")}`);
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
    } catch {
      logger.warn("Google Routes API failed, falling back to nearest-neighbor", {
        api: "route-optimization",
      });
    }
  }

  // Fall back to nearest-neighbor algorithm
  return optimizeWithNearestNeighbor(stops, options?.departureTime);
}

/**
 * Optimizes route using Google Routes API (Compute Routes)
 *
 * Strategy: Origin = kitchen. All delivery stops are intermediates with
 * optimizeWaypointOrder=true. Destination = kitchen (return) or a dummy
 * waypoint (last optimized stop) depending on returnToOrigin flag.
 *
 * Since Google requires a destination, we use a two-pass approach when
 * returnToOrigin=false:
 *  1. Send all stops as intermediates with destination = last stop
 *  2. Google optimizes intermediate order; the destination is fixed but
 *     we remap results so the optimized last intermediate + destination
 *     form the final ordered list.
 *
 * NOTE: Google Routes API treats intermediates as via-points whose order
 * it may rearrange. The destination is always the final point.
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

  // Build waypoints for ALL stops (used as intermediates)
  const allWaypoints = stops.map((stop) => {
    const waypoint: Record<string, unknown> = {
      location: {
        latLng: {
          latitude: stop.address.lat,
          longitude: stop.address.lng,
        },
      },
    };

    if (stop.deliveryWindowStart && stop.deliveryWindowEnd) {
      waypoint.arrivalTimeWindow = {
        startTime: new Date(stop.deliveryWindowStart).toISOString(),
        endTime: new Date(stop.deliveryWindowEnd).toISOString(),
      };
    }

    return waypoint;
  });

  // When not returning to origin: use kitchen as both origin AND destination
  // (round-trip), then strip the return leg. This lets Google freely optimize
  // ALL stops as intermediates without fixing any stop as the destination.
  const requestBody = {
    origin: {
      location: {
        latLng: {
          latitude: KITCHEN_COORDS.lat,
          longitude: KITCHEN_COORDS.lng,
        },
      },
    },
    destination: {
      location: {
        latLng: {
          latitude: KITCHEN_COORDS.lat,
          longitude: KITCHEN_COORDS.lng,
        },
      },
    },
    intermediates: allWaypoints,
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_AWARE",
    departureTime: (options?.departureTime || new Date()).toISOString(),
    optimizeWaypointOrder: true,
    languageCode: "en-US",
    units: "IMPERIAL",
  };

  const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": googleApiKey,
      "X-Goog-FieldMask":
        "routes.optimizedIntermediateWaypointIndex,routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.duration,routes.legs.distanceMeters,routes.legs.polyline.encodedPolyline",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google Routes API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const route = data.routes?.[0];

  if (!route) {
    throw new Error("No route returned from Google Routes API");
  }

  // Get optimized order — these are indices into the intermediates (= stops) array
  const optimizedOrder: number[] =
    route.optimizedIntermediateWaypointIndex || stops.map((_, i) => i);

  // Legs: origin→stop0, stop0→stop1, ..., stopN→destination
  // We have (stops.length + 1) legs. The last leg is return-to-kitchen — exclude it
  // unless returnToOrigin is true.
  const deliveryLegs = options?.returnToOrigin
    ? (route.legs ?? [])
    : (route.legs ?? []).slice(0, -1);

  // Build ordered stops with ETAs from leg data
  let cumulativeDuration = 0;
  const departureTime = options?.departureTime || new Date();

  const orderedStops = optimizedOrder.map((originalIndex: number, newIndex: number) => {
    const stop = stops[originalIndex];
    // Leg at newIndex corresponds to: previous waypoint → this stop
    // Leg 0 = origin → first intermediate, Leg 1 = first → second, etc.
    const leg = deliveryLegs[newIndex];

    const durationSeconds = leg?.duration ? parseInt(leg.duration.replace("s", "")) : 0;
    const distanceMeters = leg?.distanceMeters || 0;

    cumulativeDuration += durationSeconds;
    const eta = new Date(departureTime.getTime() + cumulativeDuration * 1000);

    return {
      stopId: stop.stopId,
      stopIndex: newIndex,
      eta: eta.toISOString(),
      distanceMeters,
      durationSeconds,
    };
  });

  // Total distance/duration: sum delivery legs only (exclude return leg)
  const totalDistanceMeters = deliveryLegs.reduce(
    (sum: number, leg: { distanceMeters?: number }) => sum + (leg?.distanceMeters || 0),
    0
  );
  const totalDurationSeconds = deliveryLegs.reduce(
    (sum: number, leg: { duration?: string }) =>
      sum + (leg?.duration ? parseInt(leg.duration.replace("s", "")) : 0),
    0
  );

  // Build driving polyline from per-leg polylines (delivery legs only)
  // This gives us the actual road-following path from origin through all stops
  let combinedPolyline = route.polyline?.encodedPolyline || null;

  // If we have per-leg polylines and are excluding the return leg,
  // concatenate only the delivery leg polylines for a more accurate path
  if (!options?.returnToOrigin && deliveryLegs.length > 0) {
    const legPolylines = deliveryLegs
      .map((leg: { polyline?: { encodedPolyline?: string } }) => leg?.polyline?.encodedPolyline)
      .filter(Boolean) as string[];

    if (legPolylines.length > 0) {
      // Store per-leg polylines as semicolon-separated for the client to decode
      // The client will decode each segment and concatenate the paths
      combinedPolyline = legPolylines.join(";");
    }
  }

  return {
    orderedStops,
    totalDistanceMeters,
    totalDurationSeconds,
    optimizedPolyline: combinedPolyline,
  };
}

/**
 * Simple nearest-neighbor optimization algorithm
 * Used as fallback when Google Routes API is unavailable
 */
function optimizeWithNearestNeighbor(stops: RoutableStop[], departureTime?: Date): OptimizedRoute {
  const remainingStops = [...stops];
  const orderedStops: OptimizedRoute["orderedStops"] = [];

  let currentLat: number = KITCHEN_COORDS.lat;
  let currentLng: number = KITCHEN_COORDS.lng;
  let totalDistance = 0;
  let cumulativeSeconds = 0;
  const startTime = departureTime ?? new Date();

  while (remainingStops.length > 0) {
    let bestIndex = 0;
    let bestScore = Infinity;
    let bestDistance = 0;

    for (let i = 0; i < remainingStops.length; i++) {
      const stop = remainingStops[i];
      const distance = calculateHaversineDistance(
        currentLat,
        currentLng,
        stop.address.lat!,
        stop.address.lng!
      );

      // Base score is distance in km
      let score = distance;

      // Time window awareness
      if (stop.deliveryWindowEnd) {
        const travelSeconds = estimateDrivingTime(distance);
        const arrivalTime = new Date(
          startTime.getTime() + (cumulativeSeconds + travelSeconds) * 1000
        );
        const windowEnd = new Date(stop.deliveryWindowEnd);

        // Penalize if we'd arrive after the window closes
        if (arrivalTime > windowEnd) {
          score += 50; // Large penalty for missing window
        } else {
          // Urgency bonus: prioritize stops whose windows close sooner
          const remainingMs = windowEnd.getTime() - arrivalTime.getTime();
          const urgencyBonus = Math.max(0, 1 - remainingMs / (3600 * 1000)); // 0-1 scale within 1hr
          score -= urgencyBonus * 2; // Slight priority for urgent windows
        }
      }

      if (score < bestScore) {
        bestScore = score;
        bestIndex = i;
        bestDistance = distance;
      }
    }

    const nearestStop = remainingStops.splice(bestIndex, 1)[0];
    const durationSeconds = estimateDrivingTime(bestDistance);
    cumulativeSeconds += durationSeconds;

    // Calculate ETA based on departure time + cumulative duration
    const eta = new Date(startTime.getTime() + cumulativeSeconds * 1000);

    orderedStops.push({
      stopId: nearestStop.stopId,
      stopIndex: orderedStops.length,
      eta: eta.toISOString(),
      distanceMeters: Math.round(bestDistance * 1000),
      durationSeconds,
    });

    totalDistance += bestDistance;
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
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

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
  stops: OptimizeRouteStopsInput[],
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
