import { describe, it, expect, vi } from "vitest";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import {
  computeRefundDeltaCents,
  sumAuditedRefundCents,
  issueStripeRefundDelta,
} from "../stripe-refund";

function serviceClientWithAuditEntries(totals: number[]) {
  const rows = totals.map((t) => ({ new_value: { totalRefundCents: t } }));
  const eqAction = vi.fn().mockResolvedValue({ data: rows, error: null });
  const eqOrder = vi.fn(() => ({ eq: eqAction }));
  const select = vi.fn(() => ({ eq: eqOrder }));
  const from = vi.fn(() => ({ select }));
  return { from } as unknown as SupabaseClient<Database>;
}

function stripeWith(chargeAmount: number, alreadyRefunded: number) {
  const retrieve = vi.fn().mockResolvedValue({
    latest_charge: { amount: chargeAmount, amount_refunded: alreadyRefunded },
  });
  const create = vi.fn().mockResolvedValue({ id: "re_1" });
  return {
    stripe: {
      paymentIntents: { retrieve },
      refunds: { create },
    } as unknown as Stripe,
    create,
  };
}

describe("computeRefundDeltaCents", () => {
  it("refunds the audited amount when nothing is refunded yet", () => {
    expect(computeRefundDeltaCents(1500, 5000, 0)).toBe(1500);
  });

  it("refunds only the shortfall after a partial card refund", () => {
    expect(computeRefundDeltaCents(2500, 5000, 1500)).toBe(1000);
  });

  it("returns 0 when the card already covers the audited total", () => {
    expect(computeRefundDeltaCents(1500, 5000, 1500)).toBe(0);
    expect(computeRefundDeltaCents(1500, 5000, 2000)).toBe(0);
  });

  it("never refunds beyond the charge amount", () => {
    expect(computeRefundDeltaCents(9999, 5000, 0)).toBe(5000);
    expect(computeRefundDeltaCents(9999, 5000, 5000)).toBe(0);
  });
});

describe("sumAuditedRefundCents", () => {
  it("sums totalRefundCents across refund audit entries", async () => {
    const client = serviceClientWithAuditEntries([800, 700]);
    expect(await sumAuditedRefundCents(client, "order-1")).toBe(1500);
  });

  it("ignores malformed entries", async () => {
    const rows = [
      { new_value: { totalRefundCents: 500 } },
      { new_value: { totalRefundCents: "bad" } },
      { new_value: null },
    ];
    const eqAction = vi.fn().mockResolvedValue({ data: rows, error: null });
    const eqOrder = vi.fn(() => ({ eq: eqAction }));
    const select = vi.fn(() => ({ eq: eqOrder }));
    const client = { from: vi.fn(() => ({ select })) } as unknown as SupabaseClient<Database>;
    expect(await sumAuditedRefundCents(client, "order-1")).toBe(500);
  });
});

describe("issueStripeRefundDelta", () => {
  it("creates a refund for the audited amount on a fresh refund", async () => {
    const { stripe, create } = stripeWith(5000, 0);
    const client = serviceClientWithAuditEntries([1500]);

    const outcome = await issueStripeRefundDelta({
      stripe,
      serviceClient: client,
      orderId: "order-1",
      paymentIntentId: "pi_1",
    });

    expect(outcome.succeeded).toBe(true);
    expect(outcome.refundedNowCents).toBe(1500);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_intent: "pi_1",
        amount: 1500,
        metadata: expect.objectContaining({ source: "admin-item-refund" }),
      }),
      expect.objectContaining({ idempotencyKey: "admin-refund-order-1-1500-0" })
    );
  });

  it("is a no-op when the card already covers the audited total (idempotent re-drive)", async () => {
    const { stripe, create } = stripeWith(5000, 1500);
    const client = serviceClientWithAuditEntries([1500]);

    const outcome = await issueStripeRefundDelta({
      stripe,
      serviceClient: client,
      orderId: "order-1",
      paymentIntentId: "pi_1",
    });

    expect(outcome.succeeded).toBe(true);
    expect(outcome.refundedNowCents).toBe(0);
    expect(create).not.toHaveBeenCalled();
  });

  it("recovers a previously failed card refund by refunding the shortfall", async () => {
    // Two audited refunds (800 + 700) but only 800 made it to Stripe.
    const { stripe, create } = stripeWith(5000, 800);
    const client = serviceClientWithAuditEntries([800, 700]);

    const outcome = await issueStripeRefundDelta({
      stripe,
      serviceClient: client,
      orderId: "order-1",
      paymentIntentId: "pi_1",
    });

    expect(outcome.refundedNowCents).toBe(700);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 700 }),
      expect.objectContaining({ idempotencyKey: "admin-refund-order-1-1500-800" })
    );
  });

  it("does not attempt a refund when the charge is missing", async () => {
    const retrieve = vi.fn().mockResolvedValue({ latest_charge: null });
    const create = vi.fn();
    const stripe = {
      paymentIntents: { retrieve },
      refunds: { create },
    } as unknown as Stripe;
    const client = serviceClientWithAuditEntries([1500]);

    const outcome = await issueStripeRefundDelta({
      stripe,
      serviceClient: client,
      orderId: "order-1",
      paymentIntentId: "pi_1",
    });

    expect(outcome.attempted).toBe(false);
    expect(outcome.succeeded).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });
});
