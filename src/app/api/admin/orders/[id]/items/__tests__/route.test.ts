/**
 * PATCH /api/admin/orders/[id]/items
 *
 * The admin item writes used to match 0 rows (no admin UPDATE/DELETE policy on
 * order_items) while the route answered 200 and repriced the order for lines
 * still there; 20260925180000 §1 makes them live. Pinned here:
 * - a 0-row line write fails the request before the totals are repriced;
 * - a line never drops below what apply_item_refunds already refunded (or is
 *   removed) — that would erase the refund's record while the money stays
 *   refunded. Rejected before ANY write.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const ORDER_ID = "11111111-1111-4111-8111-111111111111";
const ITEM_ID = "22222222-2222-4222-8222-222222222222";

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ limited: false }),
  adminLimiter: {},
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { exception: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const { requireAdmin } = vi.hoisted(() => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAdmin }));

import { PATCH } from "../route";

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

function setup(
  refunded: number | null,
  quantity = 3,
  writeResult: unknown = { data: [{ id: ITEM_ID }], error: null }
) {
  const calls: Call[] = [];
  let itemCalls = 0;
  const results: Record<string, unknown> = {
    orders: {
      data: {
        id: ORDER_ID,
        status: "confirmed",
        subtotal_cents: 4500,
        delivery_fee_cents: 1500,
        tax_cents: 400,
        total_cents: 6400,
        user_id: "u1",
      },
      error: null,
    },
    order_items: {
      data: [
        {
          id: ITEM_ID,
          order_id: ORDER_ID,
          name_snapshot: "Mohinga",
          base_price_snapshot: 1500,
          quantity,
          line_total_cents: 1500 * quantity,
          refunded_quantity: refunded,
        },
      ],
      error: null,
    },
  };
  requireAdmin.mockResolvedValue({
    success: true,
    userId: "admin-1",
    supabase: {
      from: vi.fn((table: string) => {
        calls.push(["from", table]);
        // order_items: 1st call reads the lines, later calls are the writes.
        if (table === "order_items" && itemCalls++ > 0) return chain(writeResult, calls);
        return chain(results[table] ?? { data: [{ id: ITEM_ID }], error: null }, calls);
      }),
    },
  });
  return calls;
}

const patch = (quantity: number) =>
  PATCH(
    new Request("http://localhost/x", {
      method: "PATCH",
      body: JSON.stringify({ items: [{ id: ITEM_ID, quantity }], reason: "Customer asked" }),
    }),
    { params: Promise.resolve({ id: ORDER_ID }) }
  );

const wrote = (calls: Call[]) => calls.some(([m]) => m === "update" || m === "delete");

describe("PATCH /api/admin/orders/[id]/items", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([1, 0])("rejects quantity %i when 2 units were already refunded", async (qty) => {
    const calls = setup(2);
    const res = await patch(qty);
    expect(res.status).toBe(409);
    expect(wrote(calls)).toBe(false);
  });

  it("allows reducing down to exactly the refunded quantity", async () => {
    const calls = setup(2);
    const res = await patch(2);
    expect(res.status).toBe(200);
    expect(calls).toContainEqual(["update", { quantity: 2, line_total_cents: 3000 }]);
  });

  it.each([
    ["update", 2],
    ["delete", 0],
  ])("fails (and never reprices the order) when the item %s matches no row", async (_, qty) => {
    const calls = setup(null, 3, { data: [], error: null });
    const res = await patch(qty as number);
    expect(res.status).toBe(500);
    // Only the initial order read — no totals UPDATE for a line still there.
    expect(calls.filter(([m, t]) => m === "from" && t === "orders")).toHaveLength(1);
  });

  it("still removes a never-refunded line", async () => {
    const calls = setup(null);
    const res = await patch(0);
    expect(res.status).toBe(200);
    expect(calls).toContainEqual(["delete"]);
  });
});
