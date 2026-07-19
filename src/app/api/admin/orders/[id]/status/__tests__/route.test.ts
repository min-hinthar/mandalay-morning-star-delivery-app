import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing the handler.
vi.mock("@/lib/auth", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ limited: false }),
  adminLimiter: {},
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { exception: vi.fn(), warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));
// The reject path returns before any email/push; mock these so importing the
// handler pulls no heavy side-effecting deps and the allow path stays inert.
vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
  sendOrderStatusEmail: vi.fn().mockResolvedValue(true),
}));
vi.mock("@/lib/email/nudges", () => ({
  getLoyaltyNudge: vi.fn(),
  getNextDeliveryCutoffText: vi.fn(),
}));
vi.mock("@/lib/push/order-status-push", () => ({ sendOrderStatusPush: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServiceClient: vi.fn(() => ({})) }));
// Execute after() callbacks inline (they are no-ops when notifyCustomer=false).
vi.mock("next/server", async (importOriginal) => {
  const mod = await importOriginal<typeof import("next/server")>();
  return {
    ...mod,
    after: (cb: () => Promise<void>) => {
      void cb();
    },
  };
});

import { PATCH } from "../route";
import { requireAdmin } from "@/lib/auth";

function makeReq(body: unknown): Request {
  return new Request("http://localhost/api/admin/orders/o1/status", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}
const params = Promise.resolve({ id: "o1" });

function mockAdminWithOrder(order: Record<string, unknown>) {
  const single = vi.fn().mockResolvedValue({ data: order, error: null });
  const ordersSelect = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({ returns: vi.fn().mockReturnValue({ single }) }),
  });
  // .update(...).eq("id").eq("status").select("id")
  const updateSelect = vi.fn().mockResolvedValue({ data: [{ id: "o1" }], error: null });
  const ordersUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select: updateSelect }) }),
  });
  const auditInsert = vi.fn().mockResolvedValue({ error: null });
  const from = vi.fn((table: string) => {
    if (table === "orders") return { select: ordersSelect, update: ordersUpdate };
    if (table === "order_audit_log") return { insert: auditInsert };
    return {};
  });
  vi.mocked(requireAdmin).mockResolvedValue({
    success: true,
    userId: "admin-1",
    supabase: { from },
  } as never);
  return { ordersUpdate };
}

describe("PATCH /api/admin/orders/[id]/status — payment gate (incident #71DC108A)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("REJECTS confirming an unpaid CARD order (stripe, null payment intent)", async () => {
    const { ordersUpdate } = mockAdminWithOrder({
      status: "pending",
      user_id: "u1",
      payment_method: "stripe",
      stripe_payment_intent_id: null,
    });
    const res = await PATCH(makeReq({ status: "confirmed" }), { params });
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.message).toMatch(/hasn't been paid/i);
    // Never even attempted the status write.
    expect(ordersUpdate).not.toHaveBeenCalled();
  });

  it("REJECTS sending an unpaid card order out_for_delivery (any fulfillment status)", async () => {
    // Even from a (hypothetically) confirmed unpaid row, advancing further is blocked.
    const { ordersUpdate } = mockAdminWithOrder({
      status: "preparing",
      user_id: "u1",
      payment_method: "stripe",
      stripe_payment_intent_id: null,
    });
    const res = await PATCH(makeReq({ status: "out_for_delivery" }), { params });
    expect(res.status).toBe(400);
    expect(ordersUpdate).not.toHaveBeenCalled();
  });

  it("ALLOWS confirming a PAID stripe order (payment intent present)", async () => {
    const { ordersUpdate } = mockAdminWithOrder({
      status: "pending",
      user_id: "u1",
      payment_method: "stripe",
      stripe_payment_intent_id: "pi_123",
    });
    const res = await PATCH(makeReq({ status: "confirmed", notifyCustomer: false }), { params });
    expect(res.status).toBe(200);
    expect(ordersUpdate).toHaveBeenCalled();
  });

  it("ALLOWS a COD order (exempt from the card-payment gate)", async () => {
    const { ordersUpdate } = mockAdminWithOrder({
      status: "pending",
      user_id: "u1",
      payment_method: "cod",
      stripe_payment_intent_id: null,
      refund_status: "none",
    });
    const res = await PATCH(makeReq({ status: "confirmed", notifyCustomer: false }), { params });
    expect(res.status).toBe(200);
    expect(ordersUpdate).toHaveBeenCalled();
  });

  it("REJECTS re-confirming a FULLY-REFUNDED card order (PI present but refund_status full)", async () => {
    // charge.refunded cancels a fully-refunded order but keeps its PI; re-opening
    // + re-confirming must NOT fulfill an order we net-collected $0 for.
    const { ordersUpdate } = mockAdminWithOrder({
      status: "pending",
      user_id: "u1",
      payment_method: "stripe",
      stripe_payment_intent_id: "pi_123",
      refund_status: "full",
    });
    const res = await PATCH(makeReq({ status: "confirmed" }), { params });
    expect(res.status).toBe(400);
    expect(ordersUpdate).not.toHaveBeenCalled();
  });
});
