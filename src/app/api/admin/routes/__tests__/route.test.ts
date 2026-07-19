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
