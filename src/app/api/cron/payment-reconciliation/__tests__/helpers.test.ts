import { describe, expect, it } from "vitest";
import {
  hasStripeHandle,
  isPendingWithinGrace,
  isWithinEmailRecency,
  PENDING_GRACE_MS,
  EMAIL_RECENCY_MS,
} from "../helpers";

const NOW = Date.parse("2026-07-10T12:00:00.000Z");
const ago = (ms: number) => new Date(NOW - ms).toISOString();

describe("hasStripeHandle", () => {
  it("true for a real PaymentIntent id", () => {
    expect(
      hasStripeHandle({ stripe_payment_intent_id: "pi_1", stripe_checkout_session_id: null })
    ).toBe(true);
  });
  it("true for a checkout session id alone", () => {
    expect(
      hasStripeHandle({ stripe_payment_intent_id: null, stripe_checkout_session_id: "cs_1" })
    ).toBe(true);
  });
  it("false when only the session_ placeholder PI is present (no session)", () => {
    expect(
      hasStripeHandle({
        stripe_payment_intent_id: "session_cs_1",
        stripe_checkout_session_id: null,
      })
    ).toBe(false);
  });
  it("false when nothing is stored", () => {
    expect(
      hasStripeHandle({ stripe_payment_intent_id: null, stripe_checkout_session_id: null })
    ).toBe(false);
  });
});

describe("isPendingWithinGrace", () => {
  it("true for a pending order younger than the grace window (skip it)", () => {
    expect(isPendingWithinGrace({ status: "pending", placed_at: ago(5 * 60 * 1000) }, NOW)).toBe(
      true
    );
  });
  it("false for a pending order older than the grace window (scan it)", () => {
    expect(
      isPendingWithinGrace({ status: "pending", placed_at: ago(PENDING_GRACE_MS + 60_000) }, NOW)
    ).toBe(false);
  });
  it("false for a cancelled order regardless of age (grace only gates pending)", () => {
    expect(isPendingWithinGrace({ status: "cancelled", placed_at: ago(60_000) }, NOW)).toBe(false);
  });
});

describe("isWithinEmailRecency", () => {
  it("true when updated within the recency window", () => {
    expect(isWithinEmailRecency({ updated_at: ago(30 * 60 * 1000) }, NOW)).toBe(true);
  });
  it("false when updated outside the recency window", () => {
    expect(isWithinEmailRecency({ updated_at: ago(EMAIL_RECENCY_MS + 60_000) }, NOW)).toBe(false);
  });
});
