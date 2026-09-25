/**
 * loadRouteTracking — the route/driver/location half of customer tracking.
 *
 * Through the customer's own client these reads were always empty
 * (routes_select / drivers_select are driver-or-admin), so tracking never
 * showed the driver, stop progress, ETA or live map. The helper reads with the
 * SERVICE client, scoped to the already-authorized order, and only exposes the
 * driver's live location while this order is out on an in-progress route.
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

const stop = (routeStatus: string, driverId: string | null = DRIVER_ID) => ({
  data: {
    id: "stop-1",
    stop_index: 2,
    status: "pending",
    eta: null,
    delivery_photo_url: "route/stop.jpg",
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
      route_stops: [stop("assigned"), { count: 5, data: null, error: null }],
      drivers: [driverRow],
    });

    const r = await loadRouteTracking({
      orderId: ORDER_ID,
      orderStatus: "confirmed",
      customerLocation,
    });

    expect(calls).toContainEqual(["eq", "order_id", ORDER_ID]);
    expect(calls).toContainEqual(["eq", "route_id", ROUTE_ID]);
    expect(calls).toContainEqual(["eq", "id", DRIVER_ID]);
    expect(r.routeId).toBe(ROUTE_ID);
    expect(r.routeStop).toMatchObject({
      stopIndex: 2,
      totalStops: 5,
      deliveryPhotoUrl: "signed:route/stop.jpg",
    });
    expect(r.driver).toMatchObject({
      fullName: "Aung",
      phone: "+15555550100",
      licensePlate: "7ABC123",
    });
    // Not out for delivery: no live location lookup at all.
    expect(calls).not.toContainEqual(["from", "location_updates"]);
    expect(r.driverLocation).toBeNull();
    expect(r.eta).toBeNull();
  });

  it("adds live location and an ETA only while the order is out on an in-progress route", async () => {
    service({
      route_stops: [
        stop("in_progress"),
        { count: 5, data: null, error: null },
        { data: { stop_index: 1 }, error: null },
      ],
      drivers: [driverRow],
      location_updates: [
        {
          data: {
            latitude: 34.1,
            longitude: -117.9,
            recorded_at: "2026-09-25T10:00:00Z",
            accuracy: 5,
            heading: 90,
          },
          error: null,
        },
      ],
    });

    const r = await loadRouteTracking({
      orderId: ORDER_ID,
      orderStatus: "out_for_delivery",
      customerLocation,
    });

    expect(r.driverLocation).toMatchObject({ latitude: 34.1, longitude: -117.9 });
    expect(r.eta).not.toBeNull();
    expect(r.eta!.minMinutes).toBeLessThanOrEqual(r.eta!.maxMinutes);
  });

  it("does not expose the location once the order is delivered, even mid-route", async () => {
    const calls = service({
      route_stops: [stop("in_progress"), { count: 5, data: null, error: null }],
      drivers: [driverRow],
    });
    const r = await loadRouteTracking({
      orderId: ORDER_ID,
      orderStatus: "delivered",
      customerLocation,
    });
    expect(calls).not.toContainEqual(["from", "location_updates"]);
    expect(r.driverLocation).toBeNull();
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
