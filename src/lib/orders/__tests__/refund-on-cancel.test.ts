import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import type { Database } from "@/types/database";
import { refundPaidOrderInFull, type OrderRefundHandles } from "@/lib/orders/refund-on-cancel";
import { inspectOrderPayment } from "@/lib/stripe/stranded-payment";
import {
  issueStripeRefundDelta,
  sumAuditedRefundCents,
} from "@/app/api/admin/orders/[id]/refund/stripe-refund";

vi.mock("@/lib/stripe/stranded-payment", () => ({ inspectOrderPayment: vi.fn() }));
vi.mock("@/app/api/admin/orders/[id]/refund/stripe-refund", () => ({
  issueStripeRefundDelta: vi.fn(),
  sumAuditedRefundCents: vi.fn(),
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { error: vi.fn(), exception: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

const mockInspect = vi.mocked(inspectOrderPayment);
const mockIssue = vi.mocked(issueStripeRefundDelta);
const mockSum = vi.mocked(sumAuditedRefundCents);

function makeServiceClient() {
  const insert = vi.fn().mockResolvedValue({ error: null });
  const from = vi.fn(() => ({ insert }));
  return { client: { from } as unknown as SupabaseClient<Database>, insert };
}

const stripe = {} as unknown as Stripe;
const paidOrder: OrderRefundHandles = {
  payment_method: "stripe",
  total_cents: 5000,
  stripe_payment_intent_id: "pi_1",
  stripe_checkout_session_id: "cs_1",
};

const baseArgs = (order: OrderRefundHandles, client: SupabaseClient<Database>) => ({
  serviceClient: client,
  stripe,
  orderId: "o1",
  order,
  actorId: "u1",
  actorRole: "customer" as const,
  reason: "changed mind",
  refundSource: "cancellation" as const,
});

beforeEach(() => vi.clearAllMocks());

describe("refundPaidOrderInFull", () => {
  it("returns refunded:false for COD without touching Stripe", async () => {
    const { client, insert } = makeServiceClient();
    const res = await refundPaidOrderInFull(
      baseArgs({ ...paidOrder, payment_method: "cod" }, client)
    );
    expect(res.refunded).toBe(false);
    expect(mockInspect).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("returns refunded:false when the order was never paid (no audit, no refund)", async () => {
    mockInspect.mockResolvedValue({
      paid: false,
      amountCents: 0,
      amountRefundedCents: 0,
      paymentIntentId: null,
      sessionId: "cs_1",
    });
    const { client, insert } = makeServiceClient();
    const res = await refundPaidOrderInFull(baseArgs(paidOrder, client));
    expect(res.refunded).toBe(false);
    expect(insert).not.toHaveBeenCalled();
    expect(mockIssue).not.toHaveBeenCalled();
  });

  it("returns refunded:false when already fully refunded", async () => {
    mockInspect.mockResolvedValue({
      paid: true,
      amountCents: 5000,
      amountRefundedCents: 5000,
      paymentIntentId: "pi_real",
      sessionId: "cs_1",
    });
    const { client, insert } = makeServiceClient();
    const res = await refundPaidOrderInFull(baseArgs(paidOrder, client));
    expect(res.refunded).toBe(false);
    expect(insert).not.toHaveBeenCalled();
  });

  it("audits the full total and drives the delta refunder for a paid order", async () => {
    mockInspect.mockResolvedValue({
      paid: true,
      amountCents: 5000,
      amountRefundedCents: 0,
      paymentIntentId: "pi_real",
      sessionId: "cs_1",
    });
    mockSum.mockResolvedValue(0);
    mockIssue.mockResolvedValue({
      attempted: true,
      succeeded: true,
      refundedNowCents: 5000,
      alreadyRefundedCents: 0,
      message: "ok",
    });
    const { client, insert } = makeServiceClient();
    const res = await refundPaidOrderInFull(baseArgs(paidOrder, client));

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        order_id: "o1",
        action: "refund",
        actor_role: "customer",
        new_value: expect.objectContaining({ totalRefundCents: 5000, source: "cancellation" }),
      })
    );
    // Uses the REAL resolved PI (not the stored handle) + the source for webhook dedup.
    expect(mockIssue).toHaveBeenCalledWith(
      expect.objectContaining({ paymentIntentId: "pi_real", refundSource: "cancellation" })
    );
    expect(res.refunded).toBe(true);
    expect(res.refundedCents).toBe(5000);
  });

  it("audits only the shortfall when partial refunds already exist", async () => {
    mockInspect.mockResolvedValue({
      paid: true,
      amountCents: 5000,
      amountRefundedCents: 1000,
      paymentIntentId: "pi_real",
      sessionId: "cs_1",
    });
    mockSum.mockResolvedValue(1000); // already audited 1000
    mockIssue.mockResolvedValue({
      attempted: true,
      succeeded: true,
      refundedNowCents: 4000,
      alreadyRefundedCents: 1000,
      message: "ok",
    });
    const { client, insert } = makeServiceClient();
    const res = await refundPaidOrderInFull(baseArgs(paidOrder, client));

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        new_value: expect.objectContaining({ totalRefundCents: 4000 }), // 5000 total − 1000 audited
      })
    );
    expect(res.refundedCents).toBe(4000);
  });
});
