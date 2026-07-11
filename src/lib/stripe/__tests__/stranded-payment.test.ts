import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import {
  classifyStrandedPayment,
  isPlaceholderPaymentIntentId,
  resolvePaymentIntentId,
  amountsFromPaymentIntent,
  inspectOrderPayment,
} from "@/lib/stripe/stranded-payment";

describe("isPlaceholderPaymentIntentId", () => {
  it("treats the session_<id> fallback as a placeholder", () => {
    expect(isPlaceholderPaymentIntentId("session_cs_test_123")).toBe(true);
  });
  it("treats a real pi_ id as concrete", () => {
    expect(isPlaceholderPaymentIntentId("pi_123")).toBe(false);
  });
  it("handles null/undefined", () => {
    expect(isPlaceholderPaymentIntentId(null)).toBe(false);
    expect(isPlaceholderPaymentIntentId(undefined)).toBe(false);
  });
});

describe("classifyStrandedPayment", () => {
  const paid = { paid: true, amountCents: 5000, amountRefundedCents: 0 };

  it("flags a paid pending order as paid_but_pending", () => {
    expect(classifyStrandedPayment("pending", paid)).toBe("paid_but_pending");
  });

  it("flags a paid cancelled order as paid_but_cancelled", () => {
    expect(classifyStrandedPayment("cancelled", paid)).toBe("paid_but_cancelled");
  });

  it("returns null when Stripe is not paid", () => {
    expect(classifyStrandedPayment("cancelled", { ...paid, paid: false })).toBeNull();
    expect(classifyStrandedPayment("pending", { ...paid, paid: false })).toBeNull();
  });

  it("returns null when fully refunded (no net money held)", () => {
    expect(
      classifyStrandedPayment("cancelled", {
        paid: true,
        amountCents: 5000,
        amountRefundedCents: 5000,
      })
    ).toBeNull();
  });

  it("still flags a partial refund that leaves net money held", () => {
    expect(
      classifyStrandedPayment("cancelled", {
        paid: true,
        amountCents: 5000,
        amountRefundedCents: 1000,
      })
    ).toBe("paid_but_cancelled");
  });

  it("returns null for healthy non-stranded statuses", () => {
    expect(classifyStrandedPayment("confirmed", paid)).toBeNull();
    expect(classifyStrandedPayment("delivered", paid)).toBeNull();
    expect(classifyStrandedPayment("preparing", paid)).toBeNull();
  });
});

describe("resolvePaymentIntentId", () => {
  it("returns a string id directly", () => {
    expect(resolvePaymentIntentId("pi_abc")).toBe("pi_abc");
  });
  it("returns .id from an expanded object", () => {
    expect(resolvePaymentIntentId({ id: "pi_xyz" } as Stripe.PaymentIntent)).toBe("pi_xyz");
  });
  it("returns null for null/undefined", () => {
    expect(resolvePaymentIntentId(null)).toBeNull();
    expect(resolvePaymentIntentId(undefined)).toBeNull();
  });
});

describe("amountsFromPaymentIntent", () => {
  it("reads amounts off an expanded latest_charge", () => {
    const pi = {
      amount: 5000,
      latest_charge: { amount: 5000, amount_refunded: 1200 },
    } as unknown as Stripe.PaymentIntent;
    expect(amountsFromPaymentIntent(pi)).toEqual({ amountCents: 5000, amountRefundedCents: 1200 });
  });
  it("falls back to pi.amount with 0 refunded when charge is unexpanded", () => {
    const pi = { amount: 4200, latest_charge: "ch_1" } as unknown as Stripe.PaymentIntent;
    expect(amountsFromPaymentIntent(pi)).toEqual({ amountCents: 4200, amountRefundedCents: 0 });
  });
});

describe("inspectOrderPayment", () => {
  it("prefers a concrete PaymentIntent and reports succeeded + refund state", async () => {
    const retrieve = vi.fn().mockResolvedValue({
      id: "pi_1",
      status: "succeeded",
      amount: 5000,
      latest_charge: { amount: 5000, amount_refunded: 0 },
    });
    const stripe = { paymentIntents: { retrieve } } as unknown as Stripe;

    const res = await inspectOrderPayment(stripe, { paymentIntentId: "pi_1", sessionId: "cs_1" });
    expect(retrieve).toHaveBeenCalledWith("pi_1", { expand: ["latest_charge"] });
    expect(res).toMatchObject({
      paid: true,
      amountCents: 5000,
      amountRefundedCents: 0,
      paymentIntentId: "pi_1",
    });
  });

  it("falls back to the checkout session when the stored PI is the session_ placeholder", async () => {
    const sessionRetrieve = vi.fn().mockResolvedValue({
      id: "cs_1",
      payment_status: "paid",
      amount_total: 3300,
      payment_intent: { id: "pi_real", latest_charge: { amount: 3300, amount_refunded: 0 } },
    });
    const piRetrieve = vi.fn();
    const stripe = {
      paymentIntents: { retrieve: piRetrieve },
      checkout: { sessions: { retrieve: sessionRetrieve } },
    } as unknown as Stripe;

    const res = await inspectOrderPayment(stripe, {
      paymentIntentId: "session_cs_1",
      sessionId: "cs_1",
    });
    expect(piRetrieve).not.toHaveBeenCalled();
    expect(sessionRetrieve).toHaveBeenCalledWith("cs_1", {
      expand: ["payment_intent.latest_charge"],
    });
    expect(res).toMatchObject({
      paid: true,
      amountCents: 3300,
      paymentIntentId: "pi_real",
      sessionId: "cs_1",
    });
  });

  it("reports not-paid for a session Stripe still marks unpaid", async () => {
    const sessionRetrieve = vi.fn().mockResolvedValue({
      id: "cs_2",
      payment_status: "unpaid",
      amount_total: 1000,
      payment_intent: null,
    });
    const stripe = {
      checkout: { sessions: { retrieve: sessionRetrieve } },
    } as unknown as Stripe;

    const res = await inspectOrderPayment(stripe, { sessionId: "cs_2" });
    expect(res.paid).toBe(false);
  });

  it("returns a not-paid inspection when there is no Stripe handle at all", async () => {
    const stripe = {} as unknown as Stripe;
    const res = await inspectOrderPayment(stripe, { paymentIntentId: null, sessionId: null });
    expect(res).toEqual({
      paid: false,
      amountCents: 0,
      amountRefundedCents: 0,
      paymentIntentId: null,
      sessionId: null,
    });
  });
});
