/**
 * Geographic clustering utility for route builder
 * Phase 80 Plan 01 - Route & Driver Assignment Foundation
 *
 * Groups delivery orders by geographic proximity using Haversine distance.
 * Provides duration estimation and cluster label generation.
 */

import { calculateHaversineDistance } from "@/lib/utils/eta";

// Kitchen location: Covina, CA
const KITCHEN_LOCATION = { lat: 34.0858, lng: -117.8896 };

// Cluster radius in kilometers (~1.2 miles)
const CLUSTER_RADIUS_KM = 2.0;

// Route time estimation constants
const ROAD_FACTOR = 1.3;
const AVG_SPEED_KMH = 35 * 1.60934; // 35 mph in km/h
const STOP_DURATION_MIN = 5;

/**
 * Distinct cluster colors for visual differentiation on the map.
 * Using CSS hex values compatible with Tailwind/design-token usage.
 */
export const CLUSTER_COLORS: string[] = [
  "#2563eb", // blue-600
  "#16a34a", // green-600
  "#dc2626", // red-600
  "#d97706", // amber-600
  "#9333ea", // purple-600
  "#0891b2", // cyan-600
  "#db2777", // pink-600
  "#65a30d", // lime-600
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClusterableOrder {
  id: string;
  lat: number | null;
  lng: number | null;
}

export interface OrderCluster {
  label: string;
  color: string;
  orderIds: string[];
  centroid: { lat: number; lng: number };
}

export interface RouteDurationEstimate {
  durationMinutes: number;
  distanceKm: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Generates a cardinal-direction label for a cluster centroid relative to
 * the kitchen location, with order count suffix.
 */
function generateClusterLabel(
  centroid: { lat: number; lng: number },
  count: number
): string {
  const latDiff = centroid.lat - KITCHEN_LOCATION.lat;
  const lngDiff = centroid.lng - KITCHEN_LOCATION.lng;

  const northSouth = latDiff >= 0 ? "North" : "South";
  const eastWest = lngDiff >= 0 ? "East" : "West";

  // Use combined direction (diagonal) unless one axis dominates significantly
  const direction = `${northSouth}${eastWest}`;

  return `${direction} \u2014 ${count} order${count !== 1 ? "s" : ""}`;
}

/**
 * Recalculates centroid as average lat/lng across all orders in the cluster.
 */
function calcCentroid(lats: number[], lngs: number[]): { lat: number; lng: number } {
  const lat = lats.reduce((sum, v) => sum + v, 0) / lats.length;
  const lng = lngs.reduce((sum, v) => sum + v, 0) / lngs.length;
  return { lat, lng };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Groups orders by geographic proximity using greedy clustering.
 *
 * Orders with null lat/lng are excluded (use getUnclusteredOrders to retrieve
 * their IDs separately). Clusters are labeled with cardinal direction relative
 * to the kitchen and order count.
 *
 * @param orders - Array of orders with optional coordinates
 * @returns Array of clusters (excludes Location Unknown orders)
 */
export function clusterOrders(orders: ClusterableOrder[]): OrderCluster[] {
  // Filter to orders with valid coordinates
  const validOrders = orders.filter(
    (o): o is ClusterableOrder & { lat: number; lng: number } =>
      o.lat !== null && o.lng !== null
  );

  if (validOrders.length === 0) {
    return [];
  }

  // Sort by latitude for stable greedy grouping
  const sorted = [...validOrders].sort((a, b) => a.lat - b.lat);

  // Greedy clustering: track mutable cluster state
  const clusterLats: number[][] = [];
  const clusterLngs: number[][] = [];
  const clusterIds: string[][] = [];
  const centroids: Array<{ lat: number; lng: number }> = [];

  for (const order of sorted) {
    let bestClusterIdx = -1;
    let bestDistance = Infinity;

    // Find nearest cluster centroid
    for (let i = 0; i < centroids.length; i++) {
      const dist = calculateHaversineDistance(
        order.lat,
        order.lng,
        centroids[i].lat,
        centroids[i].lng
      );
      if (dist < bestDistance) {
        bestDistance = dist;
        bestClusterIdx = i;
      }
    }

    if (bestClusterIdx !== -1 && bestDistance <= CLUSTER_RADIUS_KM) {
      // Add to existing cluster and recalculate centroid
      clusterLats[bestClusterIdx].push(order.lat);
      clusterLngs[bestClusterIdx].push(order.lng);
      clusterIds[bestClusterIdx].push(order.id);
      centroids[bestClusterIdx] = calcCentroid(
        clusterLats[bestClusterIdx],
        clusterLngs[bestClusterIdx]
      );
    } else {
      // Create new cluster
      clusterLats.push([order.lat]);
      clusterLngs.push([order.lng]);
      clusterIds.push([order.id]);
      centroids.push({ lat: order.lat, lng: order.lng });
    }
  }

  // Build final cluster objects
  return centroids.map((centroid, idx) => ({
    label: generateClusterLabel(centroid, clusterIds[idx].length),
    color: CLUSTER_COLORS[idx % CLUSTER_COLORS.length],
    orderIds: clusterIds[idx],
    centroid,
  }));
}

/**
 * Estimates total route duration and distance for a sequence of stops.
 *
 * Uses Haversine distance with a 1.3x road factor, 35 mph average speed,
 * and 5 minutes per stop.
 *
 * @param stops - Ordered array of stop coordinates
 * @returns Estimated duration in minutes and road-adjusted distance in km
 */
export function estimateRouteDuration(
  stops: Array<{ lat: number; lng: number }>
): RouteDurationEstimate {
  if (stops.length === 0) {
    return { durationMinutes: 0, distanceKm: 0 };
  }

  if (stops.length === 1) {
    return { durationMinutes: STOP_DURATION_MIN, distanceKm: 0 };
  }

  // Sum sequential Haversine distances
  let totalHaversineKm = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    totalHaversineKm += calculateHaversineDistance(
      stops[i].lat,
      stops[i].lng,
      stops[i + 1].lat,
      stops[i + 1].lng
    );
  }

  // Apply road factor
  const roadDistanceKm = totalHaversineKm * ROAD_FACTOR;

  // Driving time in minutes
  const drivingTimeMin = (roadDistanceKm / AVG_SPEED_KMH) * 60;

  // Add 5 min per stop
  const stopTimeMin = stops.length * STOP_DURATION_MIN;

  const durationMinutes = Math.round(drivingTimeMin + stopTimeMin);

  return {
    durationMinutes,
    distanceKm: Math.round(roadDistanceKm * 100) / 100, // round to 2 decimals
  };
}

/**
 * Returns IDs of orders that cannot be clustered (missing lat or lng).
 * These are displayed as a "Location Unknown" group in the UI.
 *
 * @param orders - All orders to inspect
 * @returns Array of order IDs with null coordinates
 */
export function getUnclusteredOrders(orders: ClusterableOrder[]): string[] {
  return orders
    .filter((o) => o.lat === null || o.lng === null)
    .map((o) => o.id);
}
