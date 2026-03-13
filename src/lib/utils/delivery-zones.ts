/**
 * Delivery Zone Determination
 *
 * Calculates bearing from kitchen to customer coordinates and determines
 * which delivery direction(s) the customer falls into.
 */

import { KITCHEN_COORDS } from "@/lib/constants/kitchen";
import { calculateHaversineDistance } from "@/lib/utils/eta";
import type { DeliveryDayConfig, DeliveryDirection, DeliveryZoneConfig } from "@/types/delivery";

/** 15 miles in km — nearby addresses skip direction filtering */
const NEARBY_RADIUS_KM = 24.14;

/** Default zone configs matching DB seed values */
export const DEFAULT_ZONES: DeliveryZoneConfig[] = [
  {
    id: "default-east",
    direction: "east",
    bearingStart: 350,
    bearingEnd: 80,
    referenceCities: ["Pomona", "San Bernardino", "Riverside"],
  },
  {
    id: "default-west",
    direction: "west",
    bearingStart: 230,
    bearingEnd: 320,
    referenceCities: ["Pasadena", "Glendale", "Long Beach", "Santa Monica"],
  },
  {
    id: "default-south",
    direction: "south",
    bearingStart: 140,
    bearingEnd: 220,
    referenceCities: ["Anaheim", "Santa Ana", "Huntington Beach", "Irvine"],
  },
];

/**
 * Calculate initial bearing from kitchen origin to destination (0-360 degrees).
 * Uses the forward azimuth formula for great-circle navigation.
 */
export function calculateBearing(destLat: number, destLng: number): number {
  const lat1 = (KITCHEN_COORDS.lat * Math.PI) / 180;
  const lat2 = (destLat * Math.PI) / 180;
  const dLng = ((destLng - KITCHEN_COORDS.lng) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return ((bearing % 360) + 360) % 360; // Normalize to 0-360
}

/**
 * Check if a bearing falls within a zone's range.
 * Handles wrap-around (e.g., east: 350-80 crosses 0).
 */
export function bearingInRange(bearing: number, start: number, end: number): boolean {
  if (start <= end) {
    return bearing >= start && bearing <= end;
  }
  // Wrap-around case (e.g., 350 to 80)
  return bearing >= start || bearing <= end;
}

/**
 * Get matching delivery directions for customer coordinates.
 * Returns multiple directions for boundary zones (gaps between defined zones).
 */
export function getDirectionsForCoords(
  lat: number,
  lng: number,
  zones: DeliveryZoneConfig[]
): Exclude<DeliveryDirection, "all">[] {
  // Nearby addresses see all delivery days — direction filtering only matters for distant routes
  const distanceKm = calculateHaversineDistance(KITCHEN_COORDS.lat, KITCHEN_COORDS.lng, lat, lng);
  if (distanceKm <= NEARBY_RADIUS_KM) return [];

  const bearing = calculateBearing(lat, lng);
  const matched: Exclude<DeliveryDirection, "all">[] = [];

  for (const zone of zones) {
    if (bearingInRange(bearing, zone.bearingStart, zone.bearingEnd)) {
      matched.push(zone.direction);
    }
  }

  // If no zone matched, this is a gap/boundary area — find the two nearest zones
  if (matched.length === 0) {
    const adjacent = findAdjacentZones(bearing, zones);
    return adjacent;
  }

  return matched;
}

/**
 * For bearings in gap zones, find the two adjacent zone directions.
 */
function findAdjacentZones(
  bearing: number,
  zones: DeliveryZoneConfig[]
): Exclude<DeliveryDirection, "all">[] {
  if (zones.length === 0) return [];

  // Calculate angular distance from bearing to each zone's boundaries
  const distances: Array<{
    direction: Exclude<DeliveryDirection, "all">;
    distance: number;
  }> = [];

  for (const zone of zones) {
    const distToStart = angleDifference(bearing, zone.bearingStart);
    const distToEnd = angleDifference(bearing, zone.bearingEnd);
    distances.push({
      direction: zone.direction,
      distance: Math.min(distToStart, distToEnd),
    });
  }

  distances.sort((a, b) => a.distance - b.distance);

  // Return the two closest zones
  const result = distances.slice(0, 2).map((d) => d.direction);

  return result;
}

/** Minimal angular difference between two bearings (0-180) */
function angleDifference(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Filter delivery days to those matching customer's direction(s).
 * Days with direction 'all' (Saturday) are always included.
 */
export function filterDaysByDirection(
  directions: Exclude<DeliveryDirection, "all">[],
  deliveryDays: DeliveryDayConfig[]
): DeliveryDayConfig[] {
  return deliveryDays.filter(
    (day) =>
      day.direction === "all" ||
      directions.includes(day.direction as Exclude<DeliveryDirection, "all">)
  );
}

/** Human-readable label for a direction */
export function getDirectionLabel(direction: DeliveryDirection): string {
  const labels: Record<DeliveryDirection, string> = {
    east: "East Route",
    west: "West Route",
    south: "South Route",
    all: "All Directions",
  };
  return labels[direction];
}
