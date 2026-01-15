/**
 * V2 Sprint 3: ETA Calculation Utility
 * Calculates estimated time of arrival for deliveries based on
 * driver location, customer location, and remaining stops.
 */

import type { ETACalculationInput, ETAResult, LatLng } from "@/types/tracking";

// Average urban delivery speed (mph)
const AVERAGE_SPEED_MPH = 35;

// Default time spent at each delivery stop (minutes)
const DEFAULT_STOP_DURATION_MINUTES = 5;

// Convert miles per hour to km per hour
const MPH_TO_KPH = 1.60934;

/**
 * Converts degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculates the Haversine distance between two coordinates
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(
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

/**
 * Calculates the distance between two LatLng points
 * @returns Distance in kilometers
 */
export function getDistance(point1: LatLng, point2: LatLng): number {
  return calculateHaversineDistance(
    point1.lat,
    point1.lng,
    point2.lat,
    point2.lng
  );
}

/**
 * Estimates driving time based on distance
 * @param distanceKm Distance in kilometers
 * @returns Estimated driving time in minutes
 */
export function estimateDrivingTime(distanceKm: number): number {
  const speedKph = AVERAGE_SPEED_MPH * MPH_TO_KPH;
  const timeHours = distanceKm / speedKph;
  return Math.round(timeHours * 60);
}

/**
 * Calculates ETA range for a delivery
 *
 * The calculation considers:
 * - Straight-line distance between driver and customer (with 1.3x road factor)
 * - Time buffer for remaining stops before this delivery
 * - Min/max range to account for traffic and variability
 *
 * @param input - Driver location, customer location, and remaining stops
 * @returns ETA result with min/max minutes and estimated arrival time
 */
export function calculateETA(input: ETACalculationInput): ETAResult {
  const {
    driverLocation,
    customerLocation,
    remainingStops,
    avgStopDurationMinutes = DEFAULT_STOP_DURATION_MINUTES,
  } = input;

  // Calculate straight-line distance
  const directDistanceKm = getDistance(driverLocation, customerLocation);

  // Apply road factor (roads are typically 1.3x longer than straight line)
  const roadDistanceKm = directDistanceKm * 1.3;

  // Estimate base driving time
  const baseDrivingTimeMinutes = estimateDrivingTime(roadDistanceKm);

  // Calculate stop buffer time
  // Driver must complete remaining stops before reaching this customer
  const stopBufferMinutes = remainingStops * avgStopDurationMinutes;

  // Calculate min/max range
  // Min: Optimistic - 80% of stop buffer, no traffic delays
  // Max: Pessimistic - 150% of stop buffer, 20% traffic delay on driving
  const minMinutes = Math.max(
    1,
    Math.round(baseDrivingTimeMinutes + stopBufferMinutes * 0.8)
  );

  const maxMinutes = Math.max(
    minMinutes + 5, // At least 5 minute range
    Math.round(baseDrivingTimeMinutes * 1.2 + stopBufferMinutes * 1.5)
  );

  // Calculate estimated arrival (midpoint of range)
  const avgMinutes = Math.round((minMinutes + maxMinutes) / 2);
  const estimatedArrival = new Date(Date.now() + avgMinutes * 60 * 1000);

  return {
    minMinutes,
    maxMinutes,
    estimatedArrival,
  };
}

/**
 * Formats ETA for display
 * @param minMinutes Minimum estimated minutes
 * @param maxMinutes Maximum estimated minutes
 * @returns Formatted string like "15-25 minutes" or "< 5 minutes"
 */
export function formatETARange(minMinutes: number, maxMinutes: number): string {
  if (minMinutes <= 5 && maxMinutes <= 10) {
    return "Less than 10 minutes";
  }

  if (minMinutes >= 60) {
    const minHours = Math.floor(minMinutes / 60);
    const maxHours = Math.ceil(maxMinutes / 60);

    if (minHours === maxHours) {
      return `About ${minHours} hour${minHours > 1 ? "s" : ""}`;
    }
    return `${minHours}-${maxHours} hours`;
  }

  // Round to nearest 5 for cleaner display
  const roundedMin = Math.floor(minMinutes / 5) * 5;
  const roundedMax = Math.ceil(maxMinutes / 5) * 5;

  return `${roundedMin}-${roundedMax} minutes`;
}

/**
 * Formats estimated arrival time for display
 * @param estimatedArrival Date object of estimated arrival
 * @returns Formatted string like "2:30 PM"
 */
export function formatArrivalTime(estimatedArrival: Date): string {
  return estimatedArrival.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Checks if driver is close enough to show "arriving soon" state
 * @param driverLocation Driver's current location
 * @param customerLocation Customer's location
 * @param thresholdKm Distance threshold in km (default 0.5km / ~0.3mi)
 * @returns true if driver is within threshold
 */
export function isArrivingSoon(
  driverLocation: LatLng,
  customerLocation: LatLng,
  thresholdKm: number = 0.5
): boolean {
  const distance = getDistance(driverLocation, customerLocation);
  return distance <= thresholdKm;
}

/**
 * Calculates remaining stops before a specific stop index
 * @param currentStopIndex The stop index the driver is currently at/heading to
 * @param targetStopIndex The stop index of the customer's order
 * @returns Number of stops remaining before customer's stop
 */
export function calculateRemainingStops(
  currentStopIndex: number,
  targetStopIndex: number
): number {
  return Math.max(0, targetStopIndex - currentStopIndex);
}
