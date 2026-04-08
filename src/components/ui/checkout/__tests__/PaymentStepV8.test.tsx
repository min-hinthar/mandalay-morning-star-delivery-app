/**
 * Phase 110 CFIX-03 — PaymentStepV8 submit button disabled contract.
 *
 * Behavioral contract: when cutoffModalOpen={true} the "Place Order" button
 * must have the disabled attribute set. This is the HTML-level defense-in-depth
 * gate (the handler-level guard is covered by usePaymentSubmit.test.ts).
 *
 * Mocking strategy: PaymentStepV8 has ~10 child components; all are stubbed
 * so the test is stable and only asserts the button disabled state.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Module mocks — declared before any import to allow vi.mock hoisting
// ---------------------------------------------------------------------------

vi.mock("framer-motion", () => {
  function motionComp(tag: string) {
    const Comp = ({ children, ...props }: Record<string, unknown>) => {
      const filtered: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(props)) {
        if (
          k === "className" ||
          k === "style" ||
          k === "onClick" ||
          k === "disabled" ||
          k === "type" ||
          k.startsWith("data-") ||
          k.startsWith("aria-")
        ) {
          filtered[k] = v;
        }
      }
      const Tag = tag as unknown as React.ElementType;
      return <Tag {...filtered}>{children as React.ReactNode}</Tag>;
    };
    Comp.displayName = `motion.${tag}`;
    return Comp;
  }
  const proxy = new Proxy({}, { get: (_t, p) => motionComp(String(p)) });
  return {
    m: proxy,
    motion: proxy,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock("@/lib/hooks/useAnimationPreference", () => ({
  useAnimationPreference: () => ({ shouldAnimate: false, getSpring: (v: unknown) => v }),
}));

vi.mock("@/lib/motion-tokens", () => ({
  spring: { default: {}, gentle: {} },
  staggerContainer: () => ({}),
  staggerItem: {},
}));

// Mock useCart — return non-empty cart with predictable values
vi.mock("@/lib/hooks/useCart", () => ({
  useCart: () => ({
    items: [{ menuItemId: "item-1", quantity: 1, modifiers: [], notes: undefined }],
    itemsSubtotal: 2500,
    isEmpty: false,
  }),
}));

// Mock checkout store
vi.mock("@/lib/stores/checkout-store", () => ({
  useCheckoutStore: () => ({
    address: { id: "addr-1", formattedAddress: "123 Test St" },
    delivery: { date: "2026-04-12", windowStart: "10:00", windowEnd: "12:00" },
    setDelivery: vi.fn(),
    customerNotes: "",
    setCustomerNotes: vi.fn(),
    tipPercent: 15,
    customTipCents: 0,
    promoCode: null,
    promoApplied: false,
    deliveryInstructions: "",
    setDeliveryInstructions: vi.fn(),
    paymentMethod: "stripe",
    setPaymentMethod: vi.fn(),
    customerPhone: "6265551234",
    customerName: "Test User",
    prevStep: vi.fn(),
    setStep: vi.fn(),
  }),
  useCanProceed: () => true,
}));

// Mock heavy child components to simple stubs
vi.mock("@/components/ui/checkout/ContactInfoSection", () => ({
  ContactInfoSection: () => <div data-testid="contact-info" />,
}));

vi.mock("@/components/ui/checkout/TipSelector", () => ({
  TipSelector: () => <div data-testid="tip-selector" />,
}));

vi.mock("@/components/ui/checkout/PromoCodeInput", () => ({
  PromoCodeInput: () => <div data-testid="promo-input" />,
}));

vi.mock("@/components/ui/checkout/DietarySummaryCard", () => ({
  DietarySummaryCard: () => <div data-testid="dietary-summary" />,
}));

vi.mock("@/components/ui/checkout/OrderSummaryCard", () => ({
  OrderSummaryCard: () => <div data-testid="order-summary" />,
}));

vi.mock("@/components/ui/checkout/CheckoutErrorBanner", () => ({
  CheckoutErrorBanner: () => <div data-testid="error-banner" />,
}));

vi.mock("@/components/ui/checkout/PaymentMethodSelector", () => ({
  PaymentMethodSelector: () => <div data-testid="payment-method" />,
}));

vi.mock("@/components/ui/checkout/usePaymentSubmit", () => ({
  usePaymentSubmit: () => ({
    isCreatingSession: false,
    error: null,
    setError: vi.fn(),
    handleCheckout: vi.fn(),
  }),
  STRIPE_TIMEOUT_MS: 10000,
}));

vi.mock("@/components/ui/branded-spinner", () => ({
  BrandedSpinner: () => <div data-testid="spinner" />,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

import { PaymentStepV8 } from "../PaymentStepV8";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PaymentStepV8 CFIX-03 submit button disabled contract", () => {
  it("Place Order button is disabled when cutoffModalOpen=true", () => {
    render(<PaymentStepV8 cutoffModalOpen={true} />);

    const button = screen.getByRole("button", { name: /place order/i });
    expect(button).toBeDisabled();
  });

  it("Place Order button is NOT disabled when cutoffModalOpen=false (default) and canProceed=true", () => {
    render(<PaymentStepV8 cutoffModalOpen={false} />);

    const button = screen.getByRole("button", { name: /place order/i });
    expect(button).not.toBeDisabled();
  });

  it("Place Order button is disabled when cutoffModalOpen=true even when canProceed would allow it", () => {
    // canProceed is mocked to true above — cutoffModalOpen alone should disable
    render(<PaymentStepV8 cutoffModalOpen={true} />);

    const button = screen.getByRole("button", { name: /place order/i });
    // disabled attribute is set
    expect(button).toHaveAttribute("disabled");
  });
});
