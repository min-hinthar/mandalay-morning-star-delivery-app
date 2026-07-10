import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";

// CRON_SECRET is read at module load — set before the route is (dynamically) imported.
process.env.CRON_SECRET = "test-secret";

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ limited: false }),
  webhookLimiter: {},
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), exception: vi.fn() },
}));
vi.mock("@/lib/stripe/server", () => ({
  stripe: {
    checkout: {
      sessions: {
        retrieve: vi.fn().mockResolvedValue({ id: "cs_1", metadata: { order_id: "o" } }),
      },
    },
  },
}));

// Real-ish classifier (pure), mocked inspection; isPlaceholderPaymentIntentId is
// needed by the real hasStripeHandle helper (unmocked).
const mockInspect = vi.fn();
vi.mock("@/lib/stripe/stranded-payment", () => ({
  inspectOrderPayment: (...a: unknown[]) => mockInspect(...a),
  classifyStrandedPayment: (
    status: string,
    insp: { paid: boolean; amountCents: number; amountRefundedCents: number }
  ) => {
    if (!insp.paid || insp.amountCents - insp.amountRefundedCents <= 0) return null;
    if (status === "pending") return "paid_but_pending";
    if (status === "cancelled") return "paid_but_cancelled";
    return null;
  },
  isPlaceholderPaymentIntentId: (v: unknown) => typeof v === "string" && v.startsWith("session_"),
}));

const mockRefund = vi
  .fn()
  .mockResolvedValue({ refunded: true, refundedCents: 5000, message: "ok" });
vi.mock("@/lib/orders/refund-on-cancel", () => ({
  refundPaidOrderInFull: (...a: unknown[]) => mockRefund(...a),
}));
const mockHeal = vi.fn().mockResolvedValue(undefined);
vi.mock("@/app/api/webhooks/stripe/handlers/checkout-session-completed", () => ({
  handleCheckoutSessionCompleted: (...a: unknown[]) => mockHeal(...a),
}));
const mockCapture = vi.fn();
const mockEmailAdmins = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/orders/stranded-payment-alert", () => ({
  captureStrandedPayment: (...a: unknown[]) => mockCapture(...a),
  emailAdminsStrandedPayment: (...a: unknown[]) => mockEmailAdmins(...a),
}));

let mockCreateServiceClient: Mock;
vi.mock("@/lib/supabase/server", () => {
  mockCreateServiceClient = vi.fn();
  return { createServiceClient: mockCreateServiceClient };
});

const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

/** A supabase whose orders query resolves to `candidates`. */
function serviceClientReturning(candidates: unknown[]) {
  const chain: Record<string, Mock> = {};
  for (const m of ["select", "in", "neq", "gte", "order", "limit"]) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.returns = vi.fn().mockResolvedValue({ data: candidates, error: null });
  return { from: vi.fn().mockReturnValue(chain) };
}

function req(auth = "Bearer test-secret") {
  return new Request("http://localhost/api/cron/payment-reconciliation", {
    headers: { authorization: auth },
  });
}

const pendingOrder = {
  id: "o-pending",
  status: "pending",
  user_id: "u1",
  payment_method: "stripe",
  placed_at: hoursAgo(2), // older than the 30-min grace window
  updated_at: hoursAgo(2),
  stripe_checkout_session_id: "cs_1",
  stripe_payment_intent_id: null,
};
const cancelledOrder = {
  id: "o-cancelled",
  status: "cancelled",
  user_id: "u2",
  payment_method: "stripe",
  placed_at: hoursAgo(2),
  updated_at: hoursAgo(2),
  stripe_checkout_session_id: "cs_2",
  stripe_payment_intent_id: "pi_2",
};

describe("payment-reconciliation cron", () => {
  let GET: (request: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockInspect.mockResolvedValue({
      paid: true,
      amountCents: 5000,
      amountRefundedCents: 0,
      paymentIntentId: "pi_x",
      sessionId: "cs_x",
    });
    mockRefund.mockResolvedValue({ refunded: true, refundedCents: 5000, message: "ok" });
    GET = (await import("../route")).GET;
  });

  it("rejects an unauthorized request", async () => {
    mockCreateServiceClient.mockReturnValue(serviceClientReturning([]));
    const res = await GET(req("Bearer wrong"));
    expect(res.status).toBe(401);
  });

  it("auto-heals a paid_but_pending order (re-drives the confirm flow)", async () => {
    mockCreateServiceClient.mockReturnValue(serviceClientReturning([pendingOrder]));
    const res = await GET(req());
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(mockHeal).toHaveBeenCalledTimes(1);
    expect(mockRefund).not.toHaveBeenCalled();
    expect(json.healedPending).toBe(1);
  });

  it("auto-refunds a paid_but_cancelled order", async () => {
    mockCreateServiceClient.mockReturnValue(serviceClientReturning([cancelledOrder]));
    const res = await GET(req());
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(mockRefund).toHaveBeenCalledTimes(1);
    expect(mockRefund).toHaveBeenCalledWith(
      expect.objectContaining({ refundSource: "auto-reconcile", actorRole: "system" })
    );
    expect(mockHeal).not.toHaveBeenCalled();
    expect(json.refundedCancelled).toBe(1);
  });

  it("is a no-op on re-run once the money is already resolved (fully refunded)", async () => {
    // Both classify to null (net captured = 0) → no heal, no refund.
    mockInspect.mockResolvedValue({
      paid: true,
      amountCents: 5000,
      amountRefundedCents: 5000,
      paymentIntentId: "pi_x",
      sessionId: "cs_x",
    });
    mockCreateServiceClient.mockReturnValue(serviceClientReturning([pendingOrder, cancelledOrder]));
    const res = await GET(req());
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(mockHeal).not.toHaveBeenCalled();
    expect(mockRefund).not.toHaveBeenCalled();
    expect(json.healedPending).toBe(0);
    expect(json.refundedCancelled).toBe(0);
  });

  it("alerts admins when an auto-refund fails to move money", async () => {
    mockRefund.mockResolvedValue({ refunded: false, refundedCents: 0, message: "no PI" });
    mockCreateServiceClient.mockReturnValue(serviceClientReturning([cancelledOrder]));
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(mockEmailAdmins).toHaveBeenCalled();
  });
});
