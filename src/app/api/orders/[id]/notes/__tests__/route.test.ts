/**
 * PATCH /api/orders/[id]/notes — the write goes through the SERVICE client.
 *
 * No customer UPDATE policy admits a notes edit: the only one,
 * orders_update_customer_cancel, has WITH CHECK status='cancelled', so the
 * user-client write 42501'd (pending/pending_approval/confirmed) or matched 0
 * rows silently (preparing/out_for_delivery) while the route answered 200.
 * These tests pin the service-client write, its owner + lock filters, and the
 * 0-row → 409 path.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

const ORDER_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ limited: false }),
  apiWriteLimiter: {},
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { exception: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const { createClient, createServiceClient } = vi.hoisted(() => ({
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient, createServiceClient }));

import { PATCH } from "../route";

type Call = [string, ...unknown[]];

/** A thenable query builder that records every chained call. */
function chain(result: unknown, calls: Call[]) {
  const proxy: unknown = new Proxy(
    {},
    {
      get(_t, prop: string) {
        if (prop === "then") {
          return (resolve: (v: unknown) => void) => resolve(result);
        }
        return (...args: unknown[]) => {
          calls.push([prop, ...args]);
          return proxy;
        };
      },
    }
  );
  return proxy;
}

function setup(order: { user_id: string; status: string } | null, writeResult: unknown) {
  const userCalls: Call[] = [];
  const serviceCalls: Call[] = [];
  createClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: USER_ID, app_metadata: {} } },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      userCalls.push(["from", table]);
      return chain(
        order ? { data: { id: ORDER_ID, ...order }, error: null } : { data: null, error: {} },
        userCalls
      );
    }),
  });
  createServiceClient.mockReturnValue({
    from: vi.fn((table: string) => {
      serviceCalls.push(["from", table]);
      return chain(writeResult, serviceCalls);
    }),
  });
  return { userCalls, serviceCalls };
}

function req(notes: unknown = "Gate code 1234") {
  return {
    json: vi.fn().mockResolvedValue({ notes }),
  } as unknown as NextRequest;
}
const params = { params: Promise.resolve({ id: ORDER_ID }) };

describe("PATCH /api/orders/[id]/notes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("writes through the service client, pinned to the owner and the unlocked statuses", async () => {
    const { userCalls, serviceCalls } = setup(
      { user_id: USER_ID, status: "confirmed" },
      { data: [{ id: ORDER_ID }], error: null }
    );

    const res = await PATCH(req("  Gate code 1234  "), params);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, notes: "Gate code 1234" });
    // The user client only reads; it never writes.
    expect(userCalls.some(([m]) => m === "update")).toBe(false);
    expect(serviceCalls).toContainEqual(["from", "orders"]);
    expect(serviceCalls).toContainEqual(["update", { special_instructions: "Gate code 1234" }]);
    expect(serviceCalls).toContainEqual(["eq", "id", ORDER_ID]);
    expect(serviceCalls).toContainEqual(["eq", "user_id", USER_ID]);
    expect(serviceCalls).toContainEqual(["not", "status", "in", "(delivered,cancelled)"]);
    expect(serviceCalls).toContainEqual(["select", "id"]);
  });

  it("returns 409 when the write matches no row (order locked in the meantime)", async () => {
    setup({ user_id: USER_ID, status: "preparing" }, { data: [], error: null });
    const res = await PATCH(req(), params);
    expect(res.status).toBe(409);
  });

  it("returns 500 when the write errors", async () => {
    setup({ user_id: USER_ID, status: "pending" }, { data: null, error: { message: "boom" } });
    const res = await PATCH(req(), params);
    expect(res.status).toBe(500);
  });

  it("rejects a delivered order before any write", async () => {
    const { serviceCalls } = setup(
      { user_id: USER_ID, status: "delivered" },
      { data: [], error: null }
    );
    const res = await PATCH(req(), params);
    expect(res.status).toBe(400);
    expect(serviceCalls).toEqual([]);
  });

  it("rejects another customer's order before any write", async () => {
    const { serviceCalls } = setup(
      { user_id: "33333333-3333-4333-8333-333333333333", status: "pending" },
      { data: [{ id: ORDER_ID }], error: null }
    );
    const res = await PATCH(req(), params);
    expect(res.status).toBe(403);
    expect(serviceCalls).toEqual([]);
  });
});
