/**
 * Driver exception → order_audit_log row.
 *
 * The audit insert used the driver's own client, but order_audit_log_insert is
 * admin-only (and actor_id was drivers.id, which isn't a profiles id — the FK
 * target), so every delivery_exception audit row was silently lost. The route
 * now writes it with the service client, after its own route/stop ownership
 * checks, with actor_id = the driver's PROFILE id.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

const ROUTE_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const STOP_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ORDER_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const DRIVER_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const USER_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

vi.mock("next/server", async (orig) => ({
  ...(await orig<typeof import("next/server")>()),
  after: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ limited: false }),
  driverActionLimiter: {},
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { exception: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(), buildEmailElement: vi.fn() }));
vi.mock("@/lib/email/admin-recipients", () => ({ getAdminEmails: vi.fn() }));

const { requireDriver, createClient, createServiceClient } = vi.hoisted(() => ({
  requireDriver: vi.fn(),
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requireDriver }));
vi.mock("@/lib/supabase/server", () => ({ createClient, createServiceClient }));

import { POST } from "../route";

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

/** Driver client whose per-table results follow the route's call order. */
function driverClient(orderId: string | null) {
  const calls: Call[] = [];
  const seen: Record<string, number> = {};
  const results: Record<string, unknown[]> = {
    routes: [
      { data: { id: ROUTE_ID, status: "in_progress", driver_id: DRIVER_ID }, error: null },
      { data: null, error: null },
    ],
    route_stops: [
      {
        data: { id: STOP_ID, status: "arrived", route_id: ROUTE_ID, order_id: orderId },
        error: null,
      },
      { data: null, error: null },
      { data: [{ status: "skipped" }], error: null },
    ],
    delivery_exceptions: [
      { data: null, error: null },
      { data: { id: "ex-1" }, error: null },
    ],
    orders: [{ data: [{ id: orderId }], error: null }],
    order_audit_log: [{ data: null, error: null }],
  };
  return {
    calls,
    client: {
      from: vi.fn((table: string) => {
        calls.push(["from", table]);
        const i = seen[table] ?? 0;
        seen[table] = i + 1;
        const list = results[table] ?? [{ data: null, error: null }];
        return chain(list[Math.min(i, list.length - 1)], calls);
      }),
    },
  };
}

function setup(orderId: string | null = ORDER_ID) {
  const driver = driverClient(orderId);
  requireDriver.mockResolvedValue({
    success: true,
    supabase: driver.client,
    userId: USER_ID,
    driverId: DRIVER_ID,
  });
  const serviceCalls: Call[] = [];
  createServiceClient.mockReturnValue({
    from: vi.fn((table: string) => {
      serviceCalls.push(["from", table]);
      return chain({ data: null, error: null }, serviceCalls);
    }),
  });
  return { driverCalls: driver.calls, serviceCalls };
}

const req = () =>
  ({
    json: vi.fn().mockResolvedValue({ type: "customer_not_home", description: "No answer" }),
  }) as unknown as NextRequest;
const params = { params: Promise.resolve({ routeId: ROUTE_ID, stopId: STOP_ID }) };

describe("driver exception audit log", () => {
  beforeEach(() => vi.clearAllMocks());

  it("writes the audit row with the service client and the driver's profile id", async () => {
    const { driverCalls, serviceCalls } = setup();

    const res = await POST(req(), params);

    expect(res.status).toBe(200);
    expect(driverCalls).not.toContainEqual(["from", "order_audit_log"]);
    expect(serviceCalls[0]).toEqual(["from", "order_audit_log"]);
    const insert = serviceCalls.find(([m]) => m === "insert");
    expect(insert?.[1]).toMatchObject({
      order_id: ORDER_ID,
      action: "delivery_exception",
      actor_id: USER_ID,
      actor_role: "driver",
    });
    expect((insert?.[1] as { actor_id: string }).actor_id).not.toBe(DRIVER_ID);
  });

  it("skips the audit row for a stop without an order", async () => {
    const { serviceCalls } = setup(null);
    const res = await POST(req(), params);
    expect(res.status).toBe(200);
    expect(serviceCalls).toEqual([]);
  });
});
