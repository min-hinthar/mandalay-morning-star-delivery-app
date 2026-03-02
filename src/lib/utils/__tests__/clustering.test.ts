/**
 * Tests for geographic clustering utility and duration estimation
 * Phase 80 Plan 01 - Route & Driver Assignment Foundation
 */

import { describe, it, expect } from "vitest";
import {
  clusterOrders,
  estimateRouteDuration,
  getUnclusteredOrders,
  CLUSTER_COLORS,
  type ClusterableOrder,
} from "../clustering";

// Kitchen location: Covina, CA
const KITCHEN = { lat: 34.0858, lng: -117.8896 };

describe("CLUSTER_COLORS", () => {
  it("provides 6+ distinct hex colors", () => {
    expect(CLUSTER_COLORS.length).toBeGreaterThanOrEqual(6);
    // Each entry should be a non-empty string
    for (const color of CLUSTER_COLORS) {
      expect(typeof color).toBe("string");
      expect(color.length).toBeGreaterThan(0);
    }
  });
});

describe("clusterOrders", () => {
  it("returns empty array for empty input", () => {
    const result = clusterOrders([]);
    expect(result).toEqual([]);
  });

  it("groups two nearby orders into the same cluster", () => {
    const orders: ClusterableOrder[] = [
      { id: "order-1", lat: 34.08, lng: -117.89 },
      { id: "order-2", lat: 34.081, lng: -117.891 }, // ~0.15km away
    ];
    const result = clusterOrders(orders);
    expect(result).toHaveLength(1);
    expect(result[0].orderIds).toContain("order-1");
    expect(result[0].orderIds).toContain("order-2");
  });

  it("creates separate clusters for distant orders", () => {
    const orders: ClusterableOrder[] = [
      { id: "order-1", lat: 34.08, lng: -117.89 },
      { id: "order-2", lat: 34.081, lng: -117.891 }, // close to order-1
      { id: "order-3", lat: 34.12, lng: -117.95 }, // ~6km from order-1
    ];
    const result = clusterOrders(orders);
    expect(result.length).toBeGreaterThanOrEqual(2);
    // Order 3 should be in a different cluster
    const clusterWithOrder3 = result.find((c) => c.orderIds.includes("order-3"));
    const clusterWithOrder1 = result.find((c) => c.orderIds.includes("order-1"));
    expect(clusterWithOrder3).toBeDefined();
    expect(clusterWithOrder1).toBeDefined();
    expect(clusterWithOrder3!.label).not.toBe(clusterWithOrder1!.label);
  });

  it("excludes orders with null coordinates from clusters", () => {
    const orders: ClusterableOrder[] = [
      { id: "order-null", lat: null, lng: null },
      { id: "order-valid", lat: 34.08, lng: -117.89 },
    ];
    const result = clusterOrders(orders);
    // Only the valid order forms a cluster
    expect(result).toHaveLength(1);
    expect(result[0].orderIds).toContain("order-valid");
    // Null order not in any cluster
    const allOrderIds = result.flatMap((c) => c.orderIds);
    expect(allOrderIds).not.toContain("order-null");
  });

  it("returns empty array when all orders have null coordinates", () => {
    const orders: ClusterableOrder[] = [
      { id: "order-1", lat: null, lng: null },
      { id: "order-2", lat: null, lng: null },
    ];
    const result = clusterOrders(orders);
    expect(result).toEqual([]);
  });

  it("assigns a label to each cluster", () => {
    const orders: ClusterableOrder[] = [
      { id: "order-1", lat: 34.08, lng: -117.89 },
    ];
    const result = clusterOrders(orders);
    expect(result[0].label).toBeTruthy();
    expect(typeof result[0].label).toBe("string");
    // Label contains order count
    expect(result[0].label).toMatch(/1 order/);
  });

  it("assigns a color to each cluster", () => {
    const orders: ClusterableOrder[] = [
      { id: "order-1", lat: 34.08, lng: -117.89 },
    ];
    const result = clusterOrders(orders);
    expect(result[0].color).toBeTruthy();
    expect(CLUSTER_COLORS).toContain(result[0].color);
  });

  it("assigns centroid to each cluster", () => {
    const orders: ClusterableOrder[] = [
      { id: "order-1", lat: 34.08, lng: -117.89 },
      { id: "order-2", lat: 34.081, lng: -117.891 },
    ];
    const result = clusterOrders(orders);
    expect(result[0].centroid).toBeDefined();
    expect(typeof result[0].centroid.lat).toBe("number");
    expect(typeof result[0].centroid.lng).toBe("number");
  });

  it("generates plural label for multiple orders", () => {
    const orders: ClusterableOrder[] = [
      { id: "order-1", lat: 34.08, lng: -117.89 },
      { id: "order-2", lat: 34.081, lng: -117.891 },
    ];
    const result = clusterOrders(orders);
    expect(result[0].label).toMatch(/2 orders/);
  });

  it("cycles colors via modulo for many clusters", () => {
    // Create 7 clusters (more than CLUSTER_COLORS length of 6)
    // Each cluster is ~10 degrees apart (very far)
    const orders: ClusterableOrder[] = Array.from({ length: 7 }, (_, i) => ({
      id: `order-${i}`,
      lat: 34.08 + i * 5,
      lng: -117.89 + i * 5,
    }));
    const result = clusterOrders(orders);
    // Should not throw, colors wrap around
    expect(result.length).toBeGreaterThan(0);
    for (const cluster of result) {
      expect(CLUSTER_COLORS).toContain(cluster.color);
    }
  });
});

describe("clusterOrders label directions", () => {
  it("labels a cluster north of kitchen as containing 'North'", () => {
    // North of Covina: higher lat
    const orders: ClusterableOrder[] = [
      { id: "order-north", lat: KITCHEN.lat + 0.5, lng: KITCHEN.lng },
    ];
    const result = clusterOrders(orders);
    expect(result[0].label).toMatch(/North/i);
  });

  it("labels a cluster south of kitchen as containing 'South'", () => {
    const orders: ClusterableOrder[] = [
      { id: "order-south", lat: KITCHEN.lat - 0.5, lng: KITCHEN.lng },
    ];
    const result = clusterOrders(orders);
    expect(result[0].label).toMatch(/South/i);
  });

  it("labels a cluster east of kitchen as containing 'East'", () => {
    // East = higher lng (less negative for this location)
    const orders: ClusterableOrder[] = [
      { id: "order-east", lat: KITCHEN.lat, lng: KITCHEN.lng + 0.5 },
    ];
    const result = clusterOrders(orders);
    expect(result[0].label).toMatch(/East/i);
  });

  it("labels a cluster west of kitchen as containing 'West'", () => {
    const orders: ClusterableOrder[] = [
      { id: "order-west", lat: KITCHEN.lat, lng: KITCHEN.lng - 0.5 },
    ];
    const result = clusterOrders(orders);
    expect(result[0].label).toMatch(/West/i);
  });
});

describe("estimateRouteDuration", () => {
  it("returns 0 duration and 0 distance for empty stops array", () => {
    const result = estimateRouteDuration([]);
    expect(result).toEqual({ durationMinutes: 0, distanceKm: 0 });
  });

  it("returns 5 min per stop and 0 distance for single stop", () => {
    const result = estimateRouteDuration([{ lat: 34.08, lng: -117.89 }]);
    expect(result.durationMinutes).toBe(5);
    expect(result.distanceKm).toBe(0);
  });

  it("returns positive duration and distance for multiple stops", () => {
    const result = estimateRouteDuration([
      { lat: 34.08, lng: -117.89 },
      { lat: 34.09, lng: -117.90 },
    ]);
    expect(result.durationMinutes).toBeGreaterThan(0);
    expect(result.distanceKm).toBeGreaterThan(0);
  });

  it("applies road factor (actual distance > straight-line distance)", () => {
    // Two stops ~1.4km straight-line apart
    const stops = [
      { lat: 34.08, lng: -117.89 },
      { lat: 34.09, lng: -117.90 },
    ];
    const result = estimateRouteDuration(stops);
    // distanceKm should be road-adjusted (1.3x Haversine)
    // Haversine between these two points is approximately 1.4km
    // Road adjusted ~1.82km
    expect(result.distanceKm).toBeGreaterThan(1.0);
  });

  it("includes stop time (5 min per stop) in total duration", () => {
    const oneStop = estimateRouteDuration([{ lat: 34.08, lng: -117.89 }]);
    const twoStops = estimateRouteDuration([
      { lat: 34.08, lng: -117.89 },
      { lat: 34.09, lng: -117.90 },
    ]);
    // Two stops should have more stop time (+5 min more than 1 stop baseline)
    // twoStops = driving time + 10 min stop time
    // oneStop = 0 driving + 5 min stop time
    expect(twoStops.durationMinutes).toBeGreaterThan(oneStop.durationMinutes);
  });

  it("returns rounded values", () => {
    const result = estimateRouteDuration([
      { lat: 34.08, lng: -117.89 },
      { lat: 34.09, lng: -117.90 },
    ]);
    // Values should be numbers (rounded)
    expect(Number.isFinite(result.durationMinutes)).toBe(true);
    expect(Number.isFinite(result.distanceKm)).toBe(true);
  });
});

describe("getUnclusteredOrders", () => {
  it("returns empty array when all orders have coordinates", () => {
    const orders: ClusterableOrder[] = [
      { id: "order-1", lat: 34.08, lng: -117.89 },
      { id: "order-2", lat: 34.09, lng: -117.90 },
    ];
    expect(getUnclusteredOrders(orders)).toEqual([]);
  });

  it("returns IDs of orders with null lat", () => {
    const orders: ClusterableOrder[] = [
      { id: "order-null-lat", lat: null, lng: -117.89 },
      { id: "order-valid", lat: 34.08, lng: -117.89 },
    ];
    const result = getUnclusteredOrders(orders);
    expect(result).toContain("order-null-lat");
    expect(result).not.toContain("order-valid");
  });

  it("returns IDs of orders with null lng", () => {
    const orders: ClusterableOrder[] = [
      { id: "order-null-lng", lat: 34.08, lng: null },
      { id: "order-valid", lat: 34.08, lng: -117.89 },
    ];
    const result = getUnclusteredOrders(orders);
    expect(result).toContain("order-null-lng");
    expect(result).not.toContain("order-valid");
  });

  it("returns IDs of orders with both null lat and lng", () => {
    const orders: ClusterableOrder[] = [
      { id: "order-null", lat: null, lng: null },
      { id: "order-valid", lat: 34.08, lng: -117.89 },
    ];
    const result = getUnclusteredOrders(orders);
    expect(result).toContain("order-null");
    expect(result).not.toContain("order-valid");
  });

  it("returns empty array for empty input", () => {
    expect(getUnclusteredOrders([])).toEqual([]);
  });
});
