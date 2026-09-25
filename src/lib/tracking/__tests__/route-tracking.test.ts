/**
 * loadRouteTracking — the route/driver/location half of customer tracking.
 *
 * Through the customer's own client these reads were always empty
 * (routes_select / drivers_select are driver-or-admin), so tracking never
 * showed the driver, stop progress, ETA or live map. The helper reads with the
 * SERVICE client, scoped to the already-authorized order, and only exposes the
 * driver's phone, plate and live location while the driver is on THIS
 * customer's leg (their stop enroute/arrived) — never the earlier trail.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { createServiceClient } = vi.hoisted(() => ({ createServiceClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServiceClient }));
vi.mock("@/lib/supabase/delivery-photos", () => ({
  getDeliveryPhotoSignedUrl: vi.fn(async (p: string | null) => (p ? `signed:${p}` : null)),
}));

import { loadRouteTracking } from "../route-tracking";

const ORDER_ID = "11111111-1111-4111-8111-111111111111";
const ROUTE_ID = "22222222-2222-4222-8222-222222222222";
const DRIVER_ID = "33333333-3333-4333-8333-333333333333";

type Call = [string, ...unknown[]];

function chain(result: unknown, calls: Call[]) {
  const proxy: unknown = new Proxy(
    {},
    {
      get(_t, prop: string) {
        if (prop === "then") return (resolve: (v: unknown) => void) => resolve(result);
        return (...args: unknown[]) => {
          calls.push([prop, ...args]);
          return proxy;
        };
      },
    }
  );
  return proxy;
}

/** Service client whose per-table results follow the helper's call order. */
function service(results: Record<string, unknown[]>) {
  const calls: Call[] = [];
  const seen: Record<string, number> = {};
  createServiceClient.mockReturnValue({
    from: vi.fn((table: string) => {
      calls.push(["from", table]);
      const i = seen[table] ?? 0;
      seen[table] = i + 1;
      const list = results[table] ?? [{ data: null, error: null }];
      return chain(list[Math.min(i, list.length - 1)], calls);
    }),
  });
  return calls;
}

const STOP_UPDATED_AT = "2026-09-25T09:55:00Z";

const stop = (
  routeStatus: string,
  driverId: string | null = DRIVER_ID,
  stopStatus = "pending"
) => ({
  data: {
    id: "stop-1",
    stop_index: 2,
    status: stopStatus,
    eta: null,
    delivery_photo_url: "route/stop.jpg",
    updated_at: STOP_UPDATED_AT,
    routes: { id: ROUTE_ID, status: routeStatus, driver_id: driverId },
  },
  error: null,
});

const driverRow = {
  data: {
    id: DRIVER_ID,
    profile_image_url: null,
    vehicle_type: "car",
    license_plate: "7ABC123",
    profiles: { full_name: "Aung", phone: "+15555550100" },
  },
  error: null,
};

const locationRow = {
  data: {
    latitude: 34.1,
    longitude: -117.9,
    recorded_at: "2026-09-25T10:00:00Z",
    accuracy: 5,
    heading: 90,
  },
  error: null,
};

const customerLocation = { lat: 34.09, lng: -117.89 };

describe("loadRouteTracking", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns nulls when the order has no stop yet", async () => {
    service({ route_stops: [{ data: null, error: null }] });
    const r = await loadRouteTracking({
      orderId: ORDER_ID,
      orderStatus: "confirmed",
      customerLocation,
    });
    expect(r).toEqual({
      routeStop: null,
      driver: null,
      driverLocation: null,
      eta: null,
      routeId: null,
    });
  });

  it("reads the stop, the route's full stop count and the driver via the service client", async () => {
    const calls = service({
      route_stops: [
        stop("assigned"),
        { count: 5, data: null, error: null },
        { data: { stop_index: 0 }, error: null },
      ],
      drivers: [driverRow],
    });

    const r = await loadRouteTracking({
      orderId: ORDER_ID,
      orderStatus: "confirmed",
      customerLocation,
    });

    expect(calls).toContainEqual(["eq", "order_id", ORDER_ID]);
    // Newest stop wins for an order re-delivered on a later route.
    expect(calls).toContainEqual(["order", "created_at", { ascending: false }]);
    expect(calls).toContainEqual(["eq", "route_id", ROUTE_ID]);
    expect(calls).toContainEqual(["eq", "id", DRIVER_ID]);
    expect(r.routeId).toBe(ROUTE_ID);
    expect(r.routeStop).toMatchObject({
      stopIndex: 2,
      totalStops: 5,
      // The driver's position (first non-terminal stop), not the customer's own index.
      currentStop: 0,
      deliveryPhotoUrl: "signed:route/stop.jpg",
    });
    // Not on this customer's leg: name + photo only — no personal phone, plate or vehicle.
    expect(r.driver).toMatchObject({
      fullName: "Aung",
      phone: null,
      licensePlate: null,
      vehicleType: null,
    });
    expect(calls).not.toContainEqual(["from", "location_updates"]);
    expect(r.driverLocation).toBeNull();
    expect(r.eta).toBeNull();
  });

  it("adds phone, plate, live location and an ETA once the driver is on this customer's leg", async () => {
    const calls = service({
      route_stops: [
        stop("in_progress", DRIVER_ID, "enroute"),
        { count: 5, data: null, error: null },
        { data: { stop_index: 2 }, error: null },
      ],
      drivers: [driverRow],
      location_updates: [locationRow],
    });

    const r = await loadRouteTracking({
      orderId: ORDER_ID,
      orderStatus: "out_for_delivery",
      customerLocation,
    });

    expect(r.driver).toMatchObject({
      phone: "+15555550100",
      licensePlate: "7ABC123",
      vehicleType: "car",
    });
    expect(r.driverLocation).toMatchObject({ latitude: 34.1, longitude: -117.9 });
    // Only points from this leg — never the route's earlier trail past other customers' doors.
    expect(calls).toContainEqual(["gte", "recorded_at", STOP_UPDATED_AT]);
    expect(r.eta).not.toBeNull();
    expect(r.eta!.minMinutes).toBeLessThanOrEqual(r.eta!.maxMinutes);
  });

  it("withholds location, phone and plate while the driver is still at earlier stops", async () => {
    const calls = service({
      route_stops: [
        stop("in_progress", DRIVER_ID, "pending"),
        { count: 5, data: null, error: null },
      ],
      drivers: [driverRow],
      location_updates: [locationRow],
    });
    const r = await loadRouteTracking({
      orderId: ORDER_ID,
      orderStatus: "out_for_delivery",
      customerLocation,
    });
    expect(calls).not.toContainEqual(["from", "location_updates"]);
    expect(r.driverLocation).toBeNull();
    expect(r.driver).toMatchObject({ fullName: "Aung", phone: null, licensePlate: null });
  });

  it.each(["skipped", "delivered"])(
    "stops live tracking once this stop is %s, even while the order stays out",
    async (stopStatus) => {
      const calls = service({
        route_stops: [
          stop("in_progress", DRIVER_ID, stopStatus),
          { count: 5, data: null, error: null },
        ],
        drivers: [driverRow],
        location_updates: [locationRow],
      });
      const r = await loadRouteTracking({
        orderId: ORDER_ID,
        orderStatus: "out_for_delivery",
        customerLocation,
      });
      expect(calls).not.toContainEqual(["from", "location_updates"]);
      expect(r.driverLocation).toBeNull();
      expect(r.driver?.phone).toBeNull();
    }
  );

  it("does not expose the location once the order is delivered, even mid-route", async () => {
    const calls = service({
      route_stops: [
        stop("in_progress", DRIVER_ID, "enroute"),
        { count: 5, data: null, error: null },
      ],
      drivers: [driverRow],
      location_updates: [locationRow],
    });
    const r = await loadRouteTracking({
      orderId: ORDER_ID,
      orderStatus: "delivered",
      customerLocation,
    });
    expect(calls).not.toContainEqual(["from", "location_updates"]);
    expect(r.driverLocation).toBeNull();
  });

  it("reads progress as complete once every stop on the route is terminal", async () => {
    service({
      route_stops: [
        stop("completed", DRIVER_ID, "delivered"),
        { count: 5, data: null, error: null },
        { data: null, error: null },
      ],
      drivers: [driverRow],
    });
    const r = await loadRouteTracking({
      orderId: ORDER_ID,
      orderStatus: "delivered",
      customerLocation,
    });
    expect(r.routeStop).toMatchObject({ currentStop: 5, totalStops: 5 });
  });

  it("counts the stops ahead of this customer into the ETA", async () => {
    // Driver on stop 1 heading on; this customer is stop 2 and already enroute
    // (driver skipped ahead) — ETA is from the driver's real position.
    service({
      route_stops: [
        stop("in_progress", DRIVER_ID, "enroute"),
        { count: 5, data: null, error: null },
        { data: { stop_index: 1 }, error: null },
      ],
      drivers: [driverRow],
      location_updates: [locationRow],
    });
    const ahead = await loadRouteTracking({
      orderId: ORDER_ID,
      orderStatus: "out_for_delivery",
      customerLocation,
    });
    service({
      route_stops: [
        stop("in_progress", DRIVER_ID, "enroute"),
        { count: 5, data: null, error: null },
        { data: { stop_index: 2 }, error: null },
      ],
      drivers: [driverRow],
      location_updates: [locationRow],
    });
    const next = await loadRouteTracking({
      orderId: ORDER_ID,
      orderStatus: "out_for_delivery",
      customerLocation,
    });
    expect(ahead.routeStop?.currentStop).toBe(1);
    expect(ahead.eta!.maxMinutes).toBeGreaterThan(next.eta!.maxMinutes);
  });

  it("skips the driver lookup for a route without a driver", async () => {
    const calls = service({
      route_stops: [stop("planned", null), { count: 1, data: null, error: null }],
    });
    const r = await loadRouteTracking({
      orderId: ORDER_ID,
      orderStatus: "confirmed",
      customerLocation,
    });
    expect(calls).not.toContainEqual(["from", "drivers"]);
    expect(r.driver).toBeNull();
    expect(r.routeStop).not.toBeNull();
  });
});
