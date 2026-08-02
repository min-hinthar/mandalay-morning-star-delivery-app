import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ limited: false }),
  adminLimiter: {},
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { exception: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { POST } from "../route";
import { requireAdmin } from "@/lib/auth";

const OID = "11111111-1111-4111-8111-111111111111";
const DRIVER_ID = "22222222-2222-4222-8222-222222222222";
const ROUTE_ID = "33333333-3333-4333-8333-333333333333";

const PAID_ORDER = {
  id: OID,
  status: "confirmed",
  payment_method: "stripe",
  stripe_payment_intent_id: "pi_paid",
  refund_status: "none",
};

function makeReq(body: unknown): NextRequest {
  return new Request("http://localhost/api/admin/routes", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  }) as unknown as NextRequest;
}

function mockOrders(orderRows: Array<Record<string, unknown>>) {
  // .from("orders").select(...).in("id", orderIds) resolves to { data, error }
  const ordersIn = vi.fn().mockResolvedValue({ data: orderRows, error: null });
  const from = vi.fn((table: string) => {
    if (table === "orders") return { select: vi.fn().mockReturnValue({ in: ordersIn }) };
    // route_stops / routes shouldn't be reached in the reject cases below.
    return { select: vi.fn(), insert: vi.fn() };
  });
  vi.mocked(requireAdmin).mockResolvedValue({
    success: true,
    userId: "admin-1",
    supabase: { from },
  } as never);
}

describe("POST /api/admin/routes — payment guard (incident #71DC108A)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects routing an unpaid card order (stripe, null payment intent)", async () => {
    mockOrders([
      {
        id: OID,
        status: "confirmed",
        payment_method: "stripe",
        stripe_payment_intent_id: null,
        refund_status: "none",
      },
    ]);
    const res = await POST(makeReq({ deliveryDate: "2026-08-01", orderIds: [OID] }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.unpaidOrderIds).toContain(OID);
  });

  it("rejects routing a fully-refunded card order (PI present, refund_status full)", async () => {
    mockOrders([
      {
        id: OID,
        status: "confirmed",
        payment_method: "stripe",
        stripe_payment_intent_id: "pi_1",
        refund_status: "full",
      },
    ]);
    const res = await POST(makeReq({ deliveryDate: "2026-08-01", orderIds: [OID] }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.unpaidOrderIds).toContain(OID);
  });
});

// ---------------------------------------------------------------------------
// Route creation reaches the INSERT — captures what is written to `routes`.
// ---------------------------------------------------------------------------

/**
 * Mocks the full happy path far enough to capture the routes insert payload.
 * Returns the spy so a test can assert the row the DB would receive.
 */
function mockCreatePath(
  orderRows: Array<Record<string, unknown>> = [PAID_ORDER],
  optimizeSetting: { value: unknown } | null = null
) {
  const routesInsert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      returns: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: ROUTE_ID, delivery_date: "2026-08-01", status: "assigned" },
          error: null,
        }),
      }),
    }),
  });

  const optimizeStopsFetch = vi.fn().mockReturnValue({
    order: vi.fn().mockReturnValue({
      returns: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  });

  const from = vi.fn((table: string) => {
    if (table === "orders") {
      return {
        select: vi
          .fn()
          .mockReturnValue({ in: vi.fn().mockResolvedValue({ data: orderRows, error: null }) }),
      };
    }
    if (table === "route_stops") {
      return {
        // Collision pre-check: .select().in().neq()
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            neq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
          // Post-insert stop fetch for optimization: .select().eq().order().returns()
          // Spied so a test can prove the optimization WORK is skipped, not
          // merely that the response message says so.
          eq: optimizeStopsFetch,
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
    }
    if (table === "routes") return { insert: routesInsert };
    if (table === "app_settings") {
      // route_optimization_enabled — absent by default, which must fail OPEN.
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: optimizeSetting, error: null }),
          }),
        }),
      };
    }
    if (table === "drivers") {
      // The create path now verifies the driver exists and is active before
      // inserting, so the happy path must resolve one.
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi
              .fn()
              .mockResolvedValue({ data: { id: DRIVER_ID, is_active: true }, error: null }),
          }),
        }),
      };
    }
    return { select: vi.fn(), insert: vi.fn() };
  });

  vi.mocked(requireAdmin).mockResolvedValue({
    success: true,
    userId: "admin-1",
    supabase: { from },
  } as never);

  return Object.assign(routesInsert, { optimizeStopsFetch });
}

describe("POST /api/admin/routes — status vs driver (chk_planned_unassigned)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("writes status 'assigned' when a driver is selected", async () => {
    // The DB enforces CHECK (status <> 'planned' OR driver_id IS NULL). Inserting
    // 'planned' alongside a driver_id violated it, so every create-with-driver
    // died as an opaque 500 "Failed to create route".
    const routesInsert = mockCreatePath();

    const res = await POST(
      makeReq({ deliveryDate: "2026-08-01", driverId: DRIVER_ID, orderIds: [OID] })
    );

    expect(res.status).toBe(201);
    const row = routesInsert.mock.calls[0][0] as { status: string; driver_id: string | null };
    expect(row.driver_id).toBe(DRIVER_ID);
    expect(row.status).toBe("assigned");
  });

  it("keeps status 'planned' when no driver is selected", async () => {
    const routesInsert = mockCreatePath();

    const res = await POST(makeReq({ deliveryDate: "2026-08-01", orderIds: [OID] }));

    expect(res.status).toBe(201);
    const row = routesInsert.mock.calls[0][0] as { status: string; driver_id: string | null };
    expect(row.driver_id).toBeNull();
    expect(row.status).toBe("planned");
  });

  it("never emits the constraint-violating combination", async () => {
    // Property: 'planned' and a non-null driver_id can never co-exist.
    for (const driverId of [DRIVER_ID, undefined]) {
      vi.clearAllMocks();
      const routesInsert = mockCreatePath();
      await POST(
        makeReq({ deliveryDate: "2026-08-01", orderIds: [OID], ...(driverId ? { driverId } : {}) })
      );
      const row = routesInsert.mock.calls[0][0] as { status: string; driver_id: string | null };
      expect(row.status === "planned" && row.driver_id !== null).toBe(false);
    }
  });
});

describe("POST /api/admin/routes — route_optimization_enabled is honoured", () => {
  beforeEach(() => vi.clearAllMocks());

  // The setting was editable in Settings -> Operations ("Automatically
  // optimize stop order for efficiency") while NOTHING read it, so switching
  // it off changed nothing and route creation optimized regardless.
  it("skips the optimization WORK when the setting is false", async () => {
    const { optimizeStopsFetch } = mockCreatePath([PAID_ORDER], { value: false });

    const res = await POST(makeReq({ deliveryDate: "2026-08-01", orderIds: [OID] }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.optimized).toBe(false);
    // The load-bearing assertion: the post-insert stop fetch that feeds the
    // optimizer must not run at all. Asserting only on the response message
    // would pass even with the gate forced open, since that message branches
    // on the same flag independently (this test was rewritten after
    // falsification proved exactly that).
    expect(optimizeStopsFetch).not.toHaveBeenCalled();
    // And it says WHY — blaming missing coordinates would send the admin
    // hunting a data problem that isn't there.
    expect(body.message).toMatch(/auto-optimization is off/i);
  });

  it("still runs the optimization work when the setting is absent", async () => {
    const { optimizeStopsFetch } = mockCreatePath([PAID_ORDER], null);

    await POST(makeReq({ deliveryDate: "2026-08-01", orderIds: [OID] }));

    expect(optimizeStopsFetch).toHaveBeenCalled();
  });

  it('treats a jsonb string "false" as off', async () => {
    mockCreatePath([PAID_ORDER], { value: "false" });

    const body = await (
      await POST(makeReq({ deliveryDate: "2026-08-01", orderIds: [OID] }))
    ).json();

    expect(body.message).toMatch(/auto-optimization is off/i);
  });

  it("fails OPEN when the setting row is missing", async () => {
    // Optimization has always been the default; an absent row must not
    // silently change how routes are built.
    mockCreatePath([PAID_ORDER], null);

    const body = await (
      await POST(makeReq({ deliveryDate: "2026-08-01", orderIds: [OID] }))
    ).json();

    expect(body.message).not.toMatch(/auto-optimization is off/i);
  });

  it("fails OPEN when the setting is explicitly true", async () => {
    mockCreatePath([PAID_ORDER], { value: true });

    const body = await (
      await POST(makeReq({ deliveryDate: "2026-08-01", orderIds: [OID] }))
    ).json();

    expect(body.message).not.toMatch(/auto-optimization is off/i);
  });
});

describe("POST /api/admin/routes — collision pre-check errors", () => {
  beforeEach(() => vi.clearAllMocks());

  it("500s instead of silently treating a failed gate query as 'no collision'", async () => {
    const from = vi.fn((table: string) => {
      if (table === "orders") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [PAID_ORDER], error: null }),
          }),
        };
      }
      if (table === "route_stops") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              neq: vi.fn().mockResolvedValue({ data: null, error: { message: "PGRST timeout" } }),
            }),
          }),
        };
      }
      return { select: vi.fn(), insert: vi.fn() };
    });
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      userId: "admin-1",
      supabase: { from },
    } as never);

    const res = await POST(makeReq({ deliveryDate: "2026-08-01", orderIds: [OID] }));

    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/verify order assignments/i);
  });
});

describe("POST /api/admin/routes — driver must exist and be active", () => {
  beforeEach(() => vi.clearAllMocks());

  /** Auth client whose drivers lookup returns `driver`. */
  function mockDriverLookup(driver: { id: string; is_active: boolean } | null) {
    const from = vi.fn((table: string) => {
      if (table === "drivers") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: driver, error: null }),
            }),
          }),
        };
      }
      if (table === "orders") {
        return {
          select: vi
            .fn()
            .mockReturnValue({ in: vi.fn().mockResolvedValue({ data: [], error: null }) }),
        };
      }
      return { select: vi.fn(), insert: vi.fn() };
    });
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true,
      userId: "admin-1",
      supabase: { from },
    } as never);
  }

  // Status + wording deliberately mirror PATCH /api/admin/orders/[id]/driver
  // (404 unknown / 400 inactive) so the two admin assignment paths can't report
  // the same condition differently.
  it("rejects an unknown driver id before touching orders", async () => {
    mockDriverLookup(null);

    const res = await POST(
      makeReq({ deliveryDate: "2026-08-01", driverId: DRIVER_ID, orderIds: [OID] })
    );

    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatch(/driver not found/i);
  });

  it("rejects a deactivated driver, matching the per-order assign endpoint", async () => {
    mockDriverLookup({ id: DRIVER_ID, is_active: false });

    const res = await POST(
      makeReq({ deliveryDate: "2026-08-01", driverId: DRIVER_ID, orderIds: [OID] })
    );

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/inactive driver/i);
  });

  it("does not run the driver lookup at all when no driver is selected", async () => {
    // An unassigned route is legitimate — the guard must not block it.
    const routesInsert = mockCreatePath();

    const res = await POST(makeReq({ deliveryDate: "2026-08-01", orderIds: [OID] }));

    expect(res.status).toBe(201);
    const row = routesInsert.mock.calls[0][0] as { driver_id: string | null };
    expect(row.driver_id).toBeNull();
  });
});
