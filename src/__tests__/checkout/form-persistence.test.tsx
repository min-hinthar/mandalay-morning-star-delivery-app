/**
 * Phase 111 CFIX-07 — Form persistence across Stripe error retry.
 *
 * Per D-02 (verbatim): "Lock the contract with a Vitest integration test
 * in src/__tests__/checkout/form-persistence.test.tsx that fills all 13
 * fields, mocks STRIPE_ERROR, asserts store still contains every field,
 * simulates Retry, asserts handleCheckout re-fires with identical data."
 *
 * Rationale for the test harness shape (vs. mounting full CheckoutClient):
 * CheckoutClient depends on next/navigation, auth, navigation guards,
 * delivery gates, framer-motion, and the entire PaymentStepV8 dependency
 * tree (TipSelector, PromoCodeInput, OrderSummaryCard, DietarySummaryCard,
 * PaymentMethodSelector). The existing CheckoutClient.test.tsx mocks
 * useCheckoutStore, which invalidates it for this test (we need the REAL
 * store). Per the plan's escape hatch ("executor may render a checkout
 * component directly"), we mount a minimal <CheckoutSubmitHarness/> that
 * calls `usePaymentSubmit` with the live store values and exposes a real
 * "Place Order" button. This mirrors PaymentStepV8's call site verbatim
 * (src/components/ui/checkout/PaymentStepV8.tsx:89-106) while keeping
 * the real useCheckoutStore + real sessionStorage persistence in play —
 * which is the contract CFIX-07 actually locks.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { useCheckoutStore } from "@/lib/stores/checkout-store";
import { usePaymentSubmit } from "@/components/ui/checkout/usePaymentSubmit";
import type { Address } from "@/types/address";

// Mock next/navigation (usePaymentSubmit uses useRouter for redirect on success)
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/checkout",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock rate limit handler — always passes through
vi.mock("@/lib/rate-limit-response", () => ({
  handleRateLimitResponse: () => false,
}));

// ---------------------------------------------------------------------------
// All 13 partialized fields that CFIX-07 must preserve across a Stripe error.
// See src/lib/stores/checkout-store.ts partialize block (lines 113-128).
// ---------------------------------------------------------------------------

const TEST_ADDRESS: Address = {
  id: "addr-test-123",
  userId: "user-test",
  label: "Home",
  line1: "123 Test St",
  line2: "Apt 4",
  city: "Covina",
  state: "CA",
  postalCode: "91722",
  formattedAddress: "123 Test St, Apt 4, Covina, CA 91722",
  latitude: 34.09,
  longitude: -117.89,
  distanceMiles: 5,
  driveTimeMinutes: 15,
  direction: "East",
  isDefault: true,
  createdAt: "2026-04-01T00:00:00.000Z",
} as unknown as Address;

const ALL_13_FIELDS = {
  address: TEST_ADDRESS,
  delivery: {
    date: "2026-04-11",
    windowStart: "10:00",
    windowEnd: "12:00",
  },
  customerNotes: "Leave at door",
  tipPercent: 15,
  customTipCents: 0,
  promoCode: "WELCOME10",
  promoApplied: true,
  discountCents: 500,
  discountLabel: "WELCOME10",
  deliveryInstructions: "Ring the bell",
  paymentMethod: "stripe" as const,
  customerPhone: "5551234567",
  customerName: "Jane Doe",
};

function populateAll13FieldsViaStore() {
  // Use dedicated setters where they exist; fall back to setState for fields
  // without a setter (addressId is derived by setAddress).
  const store = useCheckoutStore.getState();
  store.setAddress(ALL_13_FIELDS.address);
  store.setDelivery(ALL_13_FIELDS.delivery);
  store.setCustomerNotes(ALL_13_FIELDS.customerNotes);
  store.setTipPercent(ALL_13_FIELDS.tipPercent);
  // setCustomTipCents would flip tipPercent to null, so skip it here
  // since we're using tipPercent mode. Seed customTipCents via setState.
  useCheckoutStore.setState({ customTipCents: ALL_13_FIELDS.customTipCents });
  store.setPromoCode(ALL_13_FIELDS.promoCode);
  // applyPromo sets promoApplied + discountCents + discountLabel in one call
  store.applyPromo(ALL_13_FIELDS.discountCents, ALL_13_FIELDS.discountLabel);
  store.setDeliveryInstructions(ALL_13_FIELDS.deliveryInstructions);
  store.setPaymentMethod(ALL_13_FIELDS.paymentMethod);
  store.setCustomerPhone(ALL_13_FIELDS.customerPhone);
  store.setCustomerName(ALL_13_FIELDS.customerName);
}

function assertAll13FieldsPresent(state: ReturnType<typeof useCheckoutStore.getState>) {
  expect(state.addressId).toBe(TEST_ADDRESS.id);
  expect(state.address?.line1).toBe(TEST_ADDRESS.line1);
  expect(state.delivery?.date).toBe(ALL_13_FIELDS.delivery.date);
  expect(state.delivery?.windowStart).toBe(ALL_13_FIELDS.delivery.windowStart);
  expect(state.delivery?.windowEnd).toBe(ALL_13_FIELDS.delivery.windowEnd);
  expect(state.customerNotes).toBe(ALL_13_FIELDS.customerNotes);
  expect(state.tipPercent).toBe(ALL_13_FIELDS.tipPercent);
  expect(state.customTipCents).toBe(ALL_13_FIELDS.customTipCents);
  expect(state.promoCode).toBe(ALL_13_FIELDS.promoCode);
  expect(state.promoApplied).toBe(ALL_13_FIELDS.promoApplied);
  expect(state.discountCents).toBe(ALL_13_FIELDS.discountCents);
  expect(state.discountLabel).toBe(ALL_13_FIELDS.discountLabel);
  expect(state.deliveryInstructions).toBe(ALL_13_FIELDS.deliveryInstructions);
  expect(state.paymentMethod).toBe(ALL_13_FIELDS.paymentMethod);
  expect(state.customerPhone).toBe(ALL_13_FIELDS.customerPhone);
  expect(state.customerName).toBe(ALL_13_FIELDS.customerName);
}

// ---------------------------------------------------------------------------
// Minimal harness that embeds usePaymentSubmit exactly the way PaymentStepV8
// does (src/components/ui/checkout/PaymentStepV8.tsx:89-106).
// ---------------------------------------------------------------------------

function CheckoutSubmitHarness() {
  const saveToProfileRef = React.useRef(false);
  const {
    address,
    delivery,
    customerNotes,
    tipPercent,
    customTipCents,
    promoCode,
    promoApplied,
    deliveryInstructions,
    paymentMethod,
    customerPhone,
    customerName,
  } = useCheckoutStore();

  // Mirror tipCents derivation from PaymentStepV8
  const itemsSubtotal = 1500;
  const tipCents =
    tipPercent !== null ? Math.round((itemsSubtotal * tipPercent) / 100) : customTipCents;

  const { isCreatingSession, error, handleCheckout } = usePaymentSubmit({
    addressId: address?.id,
    delivery,
    canProceed: true,
    cutoffModalOpen: false,
    items: [
      {
        menuItemId: "mi-1",
        quantity: 1,
        modifiers: [],
        notes: undefined,
      } as unknown as Parameters<typeof usePaymentSubmit>[0]["items"][number],
    ],
    customerNotes,
    tipCents,
    promoCode,
    promoApplied,
    deliveryInstructions,
    paymentMethod,
    customerPhone,
    customerName,
    onCutoffPassed: undefined,
    disableGuard: undefined,
    saveToProfileRef,
  });

  return (
    <div>
      <button
        type="button"
        onClick={handleCheckout}
        disabled={isCreatingSession}
        aria-label="Place Order"
      >
        Place Order
      </button>
      {error && (
        <div role="alert" data-testid="payment-error">
          {error.code}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CFIX-07 — form persistence across Stripe error retry", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    if (typeof window !== "undefined") {
      sessionStorage.clear();
    }
    useCheckoutStore.getState().reset();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    cleanup();
    vi.clearAllMocks();
  });

  it("baseline: populates all 13 fields and useCheckoutStore reflects them", () => {
    populateAll13FieldsViaStore();
    assertAll13FieldsPresent(useCheckoutStore.getState());
  });

  it("persists all 13 fields to sessionStorage under 'checkout-store' key", () => {
    populateAll13FieldsViaStore();
    const raw = sessionStorage.getItem("checkout-store");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    const state = parsed.state;
    expect(state.addressId).toBe(TEST_ADDRESS.id);
    expect(state.address?.line1).toBe(TEST_ADDRESS.line1);
    expect(state.customerName).toBe(ALL_13_FIELDS.customerName);
    expect(state.customerPhone).toBe(ALL_13_FIELDS.customerPhone);
    expect(state.delivery?.date).toBe(ALL_13_FIELDS.delivery.date);
    expect(state.deliveryInstructions).toBe(ALL_13_FIELDS.deliveryInstructions);
    expect(state.tipPercent).toBe(ALL_13_FIELDS.tipPercent);
    expect(state.promoCode).toBe(ALL_13_FIELDS.promoCode);
    expect(state.promoApplied).toBe(ALL_13_FIELDS.promoApplied);
    expect(state.discountCents).toBe(ALL_13_FIELDS.discountCents);
    expect(state.discountLabel).toBe(ALL_13_FIELDS.discountLabel);
    expect(state.paymentMethod).toBe(ALL_13_FIELDS.paymentMethod);
    expect(state.customerNotes).toBe(ALL_13_FIELDS.customerNotes);
  });

  it("preserves all 13 fields when CheckoutSubmitHarness renders + Place Order returns STRIPE_ERROR", async () => {
    populateAll13FieldsViaStore();

    const fetchSpy = vi.fn().mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/api/checkout/session")) {
        return Promise.resolve({
          ok: false,
          status: 502,
          json: async () => ({
            error: {
              code: "STRIPE_ERROR",
              message: "Payment service temporarily unavailable",
            },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: [] }),
      });
    });
    global.fetch = fetchSpy as unknown as typeof global.fetch;

    render(<CheckoutSubmitHarness />);

    const user = userEvent.setup();
    const submitBtn = await screen.findByRole("button", { name: /place order/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/api/checkout/session"),
        expect.objectContaining({ method: "POST" })
      );
    });

    // CRITICAL ASSERTION — store still contains all 13 fields post-error
    assertAll13FieldsPresent(useCheckoutStore.getState());

    // sessionStorage also still has all 13 fields (persist middleware)
    const raw = sessionStorage.getItem("checkout-store");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.customerName).toBe(ALL_13_FIELDS.customerName);
    expect(parsed.state.customerPhone).toBe(ALL_13_FIELDS.customerPhone);
    expect(parsed.state.addressId).toBe(TEST_ADDRESS.id);
  });

  it("retry: clicking Place Order a second time re-fires fetch with identical 13-field payload", async () => {
    populateAll13FieldsViaStore();

    const fetchCalls: Array<{ url: string; body: unknown }> = [];
    const fetchSpy = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (typeof url === "string" && url.includes("/api/checkout/session")) {
        fetchCalls.push({
          url,
          body: init?.body ? JSON.parse(init.body as string) : null,
        });
        return Promise.resolve({
          ok: false,
          status: 502,
          json: async () => ({
            error: { code: "STRIPE_ERROR", message: "Temporarily unavailable" },
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: [] }) });
    });
    global.fetch = fetchSpy as unknown as typeof global.fetch;

    render(<CheckoutSubmitHarness />);

    const user = userEvent.setup();
    const submitBtn = await screen.findByRole("button", { name: /place order/i });

    // First click — STRIPE_ERROR
    await user.click(submitBtn);
    await waitFor(() => {
      expect(fetchCalls.length).toBe(1);
    });

    // Second click — Retry. Store still has all 13 fields, so the payload
    // of call #2 must match call #1 field-for-field.
    await user.click(submitBtn);
    await waitFor(() => {
      expect(fetchCalls.length).toBe(2);
    });

    // Assert store NEVER got wiped between clicks
    assertAll13FieldsPresent(useCheckoutStore.getState());

    // Assert identical payload — full deep equality on the body shape
    // defined in src/components/ui/checkout/usePaymentSubmit.ts:137-157.
    expect(fetchCalls[1].body).toEqual(fetchCalls[0].body);

    // Spot-check the core 13 fingerprint fields are present in the body
    const body = fetchCalls[0].body as Record<string, unknown>;
    expect(body.addressId).toBe(TEST_ADDRESS.id);
    expect(body.scheduledDate).toBe(ALL_13_FIELDS.delivery.date);
    expect(body.timeWindowStart).toBe(ALL_13_FIELDS.delivery.windowStart);
    expect(body.timeWindowEnd).toBe(ALL_13_FIELDS.delivery.windowEnd);
    expect(body.customerName).toBe(ALL_13_FIELDS.customerName);
    expect(body.customerPhone).toBe(ALL_13_FIELDS.customerPhone);
    expect(body.customerNotes).toBe(ALL_13_FIELDS.customerNotes);
    expect(body.deliveryInstructions).toBe(ALL_13_FIELDS.deliveryInstructions);
    expect(body.paymentMethod).toBe(ALL_13_FIELDS.paymentMethod);
    expect(body.promoCode).toBe(ALL_13_FIELDS.promoCode);
  });
});
