import { describe, expect, it, vi, beforeEach, type Mock } from "vitest";
import {
  createCheckoutCompletedEvent,
  createCheckoutExpiredEvent,
  createChargeRefundedEvent,
  createPaymentFailedEvent,
} from "@/test/mocks/stripe";
import type Stripe from "stripe";

// ── Mock dependencies ────────────────────────────────────────────────

// Mock rate-limit to always allow
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ limited: false }),
  webhookLimiter: {},
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue("stripe-sig-valid"),
  }),
}));

// Mock logger (no-op)
vi.mock("@/lib/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    exception: vi.fn(),
  },
}));

// Mock email (no-op)
vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: "email-1" }),
}));

// Build a chainable Supabase mock
function _createMockSupabaseClient() {
  const mockSelectReturn = { data: [{ id: "claimed-1" }], error: null };
  const mockUpdateReturn = { data: null, error: null };
  const mockSingleReturn = { data: null, error: null };

  const chain: Record<string, Mock> = {
    from: vi.fn(),
    select: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    single: vi.fn(),
  };

  // Default chaining: every method returns the chain
  Object.values(chain).forEach((fn) => {
    fn.mockReturnValue(chain);
  });

  // Terminal methods return data by default
  chain.select.mockReturnValue({ ...chain, data: mockSelectReturn.data, error: null });
  chain.upsert.mockReturnValue(chain);
  // When select is called after upsert, return claimed data
  chain.select.mockImplementation(() => ({
    ...chain,
    data: mockSelectReturn.data,
    error: null,
  }));
  chain.single.mockReturnValue(mockSingleReturn);

  return {
    chain,
    mockSelectReturn,
    mockUpdateReturn,
    client: { from: chain.from },
  };
}

// Track constructEvent mock
const mockConstructEvent = vi.fn();

vi.mock("@/lib/stripe/server", () => ({
  stripe: {
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
  },
}));

let mockCreateServiceClient: Mock;

vi.mock("@/lib/supabase/server", () => {
  mockCreateServiceClient = vi.fn();
  return {
    createServiceClient: mockCreateServiceClient,
  };
});

// ── Existing Tests: Event Processing ─────────────────────────────────

describe("Stripe Webhook Event Processing", () => {
  describe("Event Type: checkout.session.completed", () => {
    it("creates event with correct metadata", () => {
      const event = createCheckoutCompletedEvent("order-123", "user-456", "pi_test_789");
      const session = event.data.object as Stripe.Checkout.Session;

      expect(event.type).toBe("checkout.session.completed");
      expect(session.metadata?.order_id).toBe("order-123");
      expect(session.metadata?.user_id).toBe("user-456");
      expect(session.payment_intent).toBe("pi_test_789");
    });

    it("has correct event structure", () => {
      const event = createCheckoutCompletedEvent("order-123", "user-456");

      expect(event.id).toBeDefined();
      expect(event.object).toBe("event");
      expect(event.api_version).toBeDefined();
      expect(event.created).toBeGreaterThan(0);
      expect(event.livemode).toBe(false);
    });

    it("session has paid status", () => {
      const event = createCheckoutCompletedEvent("order-123", "user-456");
      const session = event.data.object as Stripe.Checkout.Session;

      expect(session.payment_status).toBe("paid");
      expect(session.status).toBe("complete");
    });
  });

  describe("Event Type: checkout.session.expired", () => {
    it("creates event with correct metadata", () => {
      const event = createCheckoutExpiredEvent("order-123", "user-456");
      const session = event.data.object as Stripe.Checkout.Session;

      expect(event.type).toBe("checkout.session.expired");
      expect(session.metadata?.order_id).toBe("order-123");
    });

    it("session has unpaid/expired status", () => {
      const event = createCheckoutExpiredEvent("order-123", "user-456");
      const session = event.data.object as Stripe.Checkout.Session;

      expect(session.payment_status).toBe("unpaid");
      expect(session.status).toBe("expired");
      expect(session.payment_intent).toBeNull();
    });
  });

  describe("Event Type: charge.refunded", () => {
    it("creates full refund event", () => {
      const event = createChargeRefundedEvent("pi_test_123", 5000, true);
      const charge = event.data.object as Stripe.Charge;

      expect(event.type).toBe("charge.refunded");
      expect(charge.payment_intent).toBe("pi_test_123");
      expect(charge.amount).toBe(5000);
      expect(charge.amount_refunded).toBe(5000);
      expect(charge.refunded).toBe(true);
    });

    it("creates partial refund event", () => {
      const event = createChargeRefundedEvent("pi_test_123", 5000, false);
      const charge = event.data.object as Stripe.Charge;

      expect(charge.amount_refunded).toBe(2500); // Half of 5000
      expect(charge.refunded).toBe(false);
    });

    it("identifies full refund correctly", () => {
      const fullRefundEvent = createChargeRefundedEvent("pi_test", 10000, true);
      const partialRefundEvent = createChargeRefundedEvent("pi_test", 10000, false);

      const fullCharge = fullRefundEvent.data.object as Stripe.Charge;
      const partialCharge = partialRefundEvent.data.object as Stripe.Charge;

      // Full refund: amount_refunded === amount
      expect(fullCharge.amount_refunded).toBe(fullCharge.amount);

      // Partial refund: amount_refunded < amount
      expect(partialCharge.amount_refunded).toBeLessThan(partialCharge.amount);
    });
  });

  describe("Event Type: payment_intent.payment_failed", () => {
    it("creates event with order_id when provided", () => {
      const event = createPaymentFailedEvent("order-123");
      const pi = event.data.object as Stripe.PaymentIntent;

      expect(event.type).toBe("payment_intent.payment_failed");
      expect(pi.metadata?.order_id).toBe("order-123");
    });

    it("creates event without order_id when not provided", () => {
      const event = createPaymentFailedEvent();
      const pi = event.data.object as Stripe.PaymentIntent;

      expect(pi.metadata?.order_id).toBeUndefined();
    });

    it("includes payment error details", () => {
      const event = createPaymentFailedEvent("order-123");
      const pi = event.data.object as Stripe.PaymentIntent;

      expect(pi.last_payment_error?.message).toBe("Your card was declined.");
      expect(pi.last_payment_error?.code).toBe("card_declined");
      expect(pi.status).toBe("requires_payment_method");
    });
  });
});

// ── NEW: Webhook failure scenarios (TST-02) ──────────────────────────

describe("webhook failure scenarios (TST-02)", () => {
  let POST: (request: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Dynamic import to get fresh module with mocks applied
    const routeModule = await import("../route");
    POST = routeModule.POST;
  });

  function makeRequest(body: string, sig = "stripe-sig-valid"): Request {
    return new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body,
      headers: {
        "stripe-signature": sig,
        "content-type": "application/json",
      },
    });
  }

  describe("duplicate event handling", () => {
    it("returns 200 without processing when event already claimed", async () => {
      const event = createCheckoutCompletedEvent("order-dup", "user-1");
      mockConstructEvent.mockReturnValue(event);

      // Supabase upsert returns 0 rows (already claimed)
      const fromMock = vi.fn();
      const upsertChain = {
        select: vi.fn().mockReturnValue({ data: [], error: null }),
      };
      const upsertMock = vi.fn().mockReturnValue(upsertChain);
      fromMock.mockReturnValue({ upsert: upsertMock });

      mockCreateServiceClient.mockReturnValue({ from: fromMock });

      const res = await POST(makeRequest(JSON.stringify(event)));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.duplicate).toBe(true);
    });
  });

  describe("malformed payload", () => {
    it("returns 400 for non-JSON body", async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error("Invalid payload");
      });

      mockCreateServiceClient.mockReturnValue({});

      const res = await POST(makeRequest("not-json-at-all!!!"));
      expect(res.status).toBe(400);
    });
  });

  describe("invalid signature", () => {
    it("returns 400 when stripe signature verification fails", async () => {
      mockConstructEvent.mockImplementation(() => {
        const err = new Error("Webhook signature verification failed");
        err.name = "StripeSignatureVerificationError";
        throw err;
      });

      mockCreateServiceClient.mockReturnValue({});

      const res = await POST(makeRequest("{}", "bad-sig"));
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toContain("Webhook Error");
    });
  });

  describe("missing order handling", () => {
    it("returns 200 when checkout.session.completed has no order_id in metadata", async () => {
      // Event with missing order_id
      const event: Stripe.Event = {
        id: "evt_no_order",
        type: "checkout.session.completed",
        api_version: "2023-10-16",
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 0,
        request: { id: null, idempotency_key: null },
        object: "event",
        data: {
          object: {
            id: "cs_no_order",
            object: "checkout.session",
            payment_intent: "pi_test",
            payment_status: "paid",
            status: "complete",
            metadata: {},
          } as unknown as Stripe.Checkout.Session,
        },
      };

      mockConstructEvent.mockReturnValue(event);

      // Upsert succeeds (new event claimed)
      const fromMock = vi.fn();
      const chains: Record<string, unknown> = {};

      fromMock.mockImplementation((table: string) => {
        if (table === "webhook_events") {
          return {
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                data: [{ id: "claimed-1" }],
                error: null,
              }),
            }),
          };
        }
        // orders table -- should not be called since no order_id
        return chains;
      });

      mockCreateServiceClient.mockReturnValue({ from: fromMock });

      const res = await POST(makeRequest(JSON.stringify(event)));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.received).toBe(true);
    });
  });

  describe("status transitions", () => {
    it("checkout.session.completed updates order status to confirmed", async () => {
      const event = createCheckoutCompletedEvent("order-123", "user-456", "pi_test");
      mockConstructEvent.mockReturnValue(event);

      const updateMock = vi.fn();
      const fromMock = vi.fn();

      fromMock.mockImplementation((table: string) => {
        if (table === "webhook_events") {
          return {
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                data: [{ id: "claimed-1" }],
                error: null,
              }),
            }),
          };
        }
        if (table === "orders") {
          const eqChain = {
            eq: vi.fn().mockReturnValue({ error: null }),
          };
          updateMock.mockReturnValue(eqChain);
          return {
            update: updateMock,
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockReturnValue({
                  data: {
                    id: "order-123",
                    user_id: "user-456",
                    subtotal_cents: 1000,
                    delivery_fee_cents: 300,
                    tax_cents: 100,
                    total_cents: 1400,
                    delivery_window_start: null,
                    delivery_window_end: null,
                    special_instructions: null,
                    placed_at: "2026-03-01T00:00:00Z",
                    profiles: { email: "test@test.com", full_name: "Test" },
                    addresses: {
                      line_1: "123 Test",
                      line_2: null,
                      city: "LA",
                      state: "CA",
                      postal_code: "90001",
                    },
                    order_items: [],
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockReturnValue({
                  data: { email: "test@test.com", full_name: "Test" },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      mockCreateServiceClient.mockReturnValue({ from: fromMock });

      const res = await POST(makeRequest(JSON.stringify(event)));
      expect(res.status).toBe(200);

      // Verify update was called with status: "confirmed"
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: "confirmed" })
      );
    });
  });

  describe("charge.refunded handling", () => {
    it("updates order on full refund for pre-delivery order", async () => {
      const event = createChargeRefundedEvent("pi_refund_test", 5000, true);
      mockConstructEvent.mockReturnValue(event);

      const updateMock = vi.fn();
      const fromMock = vi.fn();

      fromMock.mockImplementation((table: string) => {
        if (table === "webhook_events") {
          return {
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                data: [{ id: "claimed-1" }],
                error: null,
              }),
            }),
          };
        }
        if (table === "orders") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockReturnValue({
                  data: {
                    id: "order-refund",
                    status: "confirmed",
                    user_id: "user-1",
                    total_cents: 5000,
                  },
                  error: null,
                }),
              }),
            }),
            update: updateMock.mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({ error: null }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockReturnValue({
                  data: { email: "test@test.com", full_name: "Test" },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      mockCreateServiceClient.mockReturnValue({ from: fromMock });

      const res = await POST(makeRequest(JSON.stringify(event)));
      expect(res.status).toBe(200);

      // Verify update was called with status: "cancelled"
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: "cancelled" })
      );
    });
  });

  describe("unknown event type", () => {
    it("returns 200 without processing for unknown event types", async () => {
      const unknownEvent: Stripe.Event = {
        id: "evt_unknown",
        type: "unknown.event.type" as Stripe.Event["type"],
        api_version: "2023-10-16",
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 0,
        request: { id: null, idempotency_key: null },
        object: "event",
        data: {
          object: {} as Stripe.Event.Data["object"],
        },
      };

      mockConstructEvent.mockReturnValue(unknownEvent);

      const fromMock = vi.fn();
      fromMock.mockImplementation((table: string) => {
        if (table === "webhook_events") {
          return {
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                data: [{ id: "claimed-1" }],
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      mockCreateServiceClient.mockReturnValue({ from: fromMock });

      const res = await POST(makeRequest(JSON.stringify(unknownEvent)));
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.received).toBe(true);
    });
  });
});

// ── Existing: Business Logic Tests ───────────────────────────────────

describe("Webhook Handler Business Logic", () => {
  describe("Order Status Transitions", () => {
    it("checkout.session.completed should transition order to confirmed", () => {
      const validTransitions = {
        pending: ["confirmed", "cancelled"],
        confirmed: ["preparing", "cancelled"],
        preparing: ["out_for_delivery", "cancelled"],
        out_for_delivery: ["delivered", "cancelled"],
        delivered: [],
        cancelled: [],
      };

      expect(validTransitions.pending).toContain("confirmed");
    });

    it("checkout.session.expired should transition order to cancelled", () => {
      const validTransitions = {
        pending: ["confirmed", "cancelled"],
      };

      expect(validTransitions.pending).toContain("cancelled");
    });

    it("charge.refunded (full) should transition order to cancelled", () => {
      // Full refund cancels the order regardless of current status
      // Partial refund logs but doesn't change status
    });
  });

  describe("Idempotency", () => {
    it("should only update pending orders for checkout.session.completed", () => {
      const statusFilter = "pending";
      expect(statusFilter).toBe("pending");
    });

    it("should only update pending orders for checkout.session.expired", () => {
      const statusFilter = "pending";
      expect(statusFilter).toBe("pending");
    });
  });

  describe("Email Notification Trigger", () => {
    it("should trigger email after successful payment confirmation", () => {
      const emailIsCritical = false;
      expect(emailIsCritical).toBe(false);
    });
  });

  describe("Webhook Security", () => {
    it("requires valid Stripe signature", () => {
      const requiresSignature = true;
      expect(requiresSignature).toBe(true);
    });

    it("returns 500 if webhook secret not configured", () => {
      const errorCode = 500;
      expect(errorCode).toBe(500);
    });

    it("acknowledges unknown event types with 200", () => {
      const unknownEventResponse = 200;
      expect(unknownEventResponse).toBe(200);
    });
  });
});

describe("Webhook Event Payload Structure", () => {
  it("checkout.session metadata contains required fields", () => {
    const requiredMetadata = ["order_id", "user_id"];
    const event = createCheckoutCompletedEvent("order-123", "user-456");
    const session = event.data.object as Stripe.Checkout.Session;

    requiredMetadata.forEach((field) => {
      expect(session.metadata).toHaveProperty(field);
    });
  });

  it("payment_intent has correct status on failure", () => {
    const event = createPaymentFailedEvent("order-123");
    const pi = event.data.object as Stripe.PaymentIntent;

    expect(pi.status).toBe("requires_payment_method");
  });

  it("charge.refunded has payment_intent for order lookup", () => {
    const event = createChargeRefundedEvent("pi_test_123", 5000, true);
    const charge = event.data.object as Stripe.Charge;

    expect(charge.payment_intent).toBe("pi_test_123");
  });
});
