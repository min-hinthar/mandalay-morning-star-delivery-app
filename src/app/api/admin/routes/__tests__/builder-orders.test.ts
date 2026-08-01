/**
 * GET /api/admin/routes/builder-orders — the picker must offer exactly what
 * POST /api/admin/routes will accept.
 *
 * Two ways it diverged:
 *
 * (a) It hid any order with ANY route_stops row, including stops on COMPLETED
 *     routes — so an order skipped on a finished run could never be re-added
 *     for redelivery, even though POST's gate only blocks non-completed routes
 *     and this file's own comment claimed the same.
 *
 * (b) It applied no payment filter, while POST rejects the ENTIRE batch with a
 *     400 if any selected order is an unpaid or fully-refunded card order. One
 *     stale order left in the picker could therefore 400 an otherwise-valid
 *     route, and (before the sibling fix) the admin was not told which one.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ limited: false }),
  adminLimiter: {},
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { exception: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));
vi.mock("@/lib/auth", () => ({ requireAdmin: vi.fn() }));

import { GET } from "../builder-orders/route";
import { requireAdmin } from "@/lib/auth";

const PAID = {
  payment_method: "stripe",
  stripe_payment_intent_id: "pi_1",
  refund_status: "none",
};

function order(id: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    status: "confirmed",
    total_cents: 5000,
    delivery_window_start: "2026-08-08T17:00:00Z",
    delivery_window_end: "2026-08-08T19:00:00Z",
    placed_at: "2026-08-01T00:00:00Z",
    order_items: [{ quantity: 1 }],
    profiles: { full_name: "A", email: "a@example.com" },
    addresses: { line_1: "1 St", city: "Covina", lat: 34.1, lng: -117.9 },
    route_stops: [],
    ...PAID,
    ...extra,
  };
}

/** Mocks the orders query; the endpoint also issues a second count query. */
function mockOrders(rows: Array<Record<string, unknown>>) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.gte = vi.fn().mockReturnValue(chain);
  chain.lt = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.returns = vi.fn().mockResolvedValue({ data: rows, error: null });
  chain.then = undefined;

  const from = vi.fn(() => chain);
  vi.mocked(requireAdmin).mockResolvedValue({
    success: true,
    userId: "admin-1",
    supabase: { from },
  } as never);
  return from;
}

async function idsFrom(res: Response): Promise<string[]> {
  const body = await res.json();
  const list = Array.isArray(body) ? body : (body.data ?? []);
  return list.map((o: { id: string }) => o.id);
}

const req = () => new Request("http://localhost/api/admin/routes/builder-orders");

describe("builder-orders — offers exactly what POST accepts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("offers an order whose only stop was on a COMPLETED route (redelivery)", async () => {
    mockOrders([
      order("o-completed", { route_stops: [{ id: "s1", routes: { status: "completed" } }] }),
    ]);

    const res = await GET(req());

    expect(await idsFrom(res)).toContain("o-completed");
  });

  it("still hides an order sitting on an ACTIVE route", async () => {
    mockOrders([
      order("o-active", { route_stops: [{ id: "s1", routes: { status: "assigned" } }] }),
      order("o-free"),
    ]);

    const ids = await idsFrom(await GET(req()));

    expect(ids).toContain("o-free");
    expect(ids).not.toContain("o-active");
  });

  it("hides unpaid and fully-refunded card orders that POST would 400 the batch over", async () => {
    mockOrders([
      order("o-ok"),
      order("o-nopi", { stripe_payment_intent_id: null }),
      order("o-refunded", { refund_status: "full" }),
    ]);

    const ids = await idsFrom(await GET(req()));

    expect(ids).toEqual(["o-ok"]);
  });

  it("keeps COD orders, which the payment gate exempts", async () => {
    mockOrders([order("o-cod", { payment_method: "cod", stripe_payment_intent_id: null })]);

    expect(await idsFrom(await GET(req()))).toContain("o-cod");
  });
});
