/**
 * Phase 110 CFIX-02 — CheckoutClient render-time empty cart guard.
 *
 * Behavioral contract: when useCart returns isEmpty=true, CheckoutClient
 * renders EmptyCheckoutError IMMEDIATELY (synchronous, not via useEffect)
 * and skips the loading spinner and router.replace call.
 *
 * Also validates the EmptyCheckoutError component itself in isolation
 * (role="status", Browse Menu CTA, href="/menu").
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockRouterReplace = vi.fn();
const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
  }),
}));

vi.mock("framer-motion", () => {
  function motionComp(tag: string) {
    const Comp = ({ children, ...props }: Record<string, unknown>) => {
      const filtered: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(props)) {
        if (
          k === "className" ||
          k === "style" ||
          k === "onClick" ||
          k === "role" ||
          k === "disabled" ||
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

// Control isEmpty via a mutable ref so each test can set its own value
let mockIsEmpty = true;

vi.mock("@/lib/hooks/useCart", () => ({
  useCart: () => ({
    items: mockIsEmpty ? [] : [{ menuItemId: "item-1", quantity: 1, modifiers: [] }],
    itemsSubtotal: mockIsEmpty ? 0 : 2500,
    isEmpty: mockIsEmpty,
  }),
}));

// Mock auth — authenticated by default so the auth gate doesn't block
vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" }, isLoading: false }),
}));

// Mock navigation guard
vi.mock("@/lib/hooks/useNavigationGuard", () => ({
  useNavigationGuard: () => ({
    showModal: false,
    proceed: vi.fn(),
    cancel: vi.fn(),
    disable: vi.fn(),
  }),
}));

// Mock delivery gates
vi.mock("@/lib/hooks/useDeliveryGate", () => ({
  useDeliveryGate: () => ({ isOpen: true, deliveryDate: { displayDate: "Saturday" } }),
  useDeliveryGateMultiDay: () => ({ isOpen: true, deliveryDate: { displayDate: "Saturday" } }),
}));

// Mock checkout store — stable fn identity + spy accessor for assertions
const mockResetFn = vi.fn();
const mockSetStepFn = vi.fn();
const mockSetDeliveryFn = vi.fn();
vi.mock("@/lib/stores/checkout-store", () => ({
  useCheckoutStore: () => ({
    step: "address",
    setStep: mockSetStepFn,
    reset: mockResetFn,
    setDelivery: mockSetDeliveryFn,
  }),
}));

// Stub all checkout step components
// Import the REAL EmptyCheckoutError before mocking the barrel,
// so the isolation tests below can render the genuine implementation.
import { EmptyCheckoutError as RealEmptyCheckoutError } from "@/components/ui/checkout/EmptyCheckoutError";

vi.mock("@/components/ui/checkout", () => ({
  CheckoutStepperV8: () => <div data-testid="stepper" />,
  AddressStep: () => <div data-testid="address-step" />,
  TimeStep: () => <div data-testid="time-step" />,
  PaymentStep: () => <div data-testid="payment-step" />,
  CheckoutSummary: () => <div data-testid="checkout-summary" />,
  // Render a testid wrapper so CheckoutClient tests can detect it in the DOM
  EmptyCheckoutError: () => (
    <div data-testid="empty-checkout-error">
      <RealEmptyCheckoutError />
    </div>
  ),
}));

vi.mock("@/components/ui/cart/CartNavigationGuard", () => ({
  CartNavigationGuard: () => null,
}));

vi.mock("@/components/ui/delivery", () => ({
  CutoffModal: () => null,
}));

import CheckoutClient from "../CheckoutClient";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CheckoutClient CFIX-02 render-time empty cart guard", () => {
  beforeEach(() => {
    mockRouterReplace.mockClear();
    mockRouterPush.mockClear();
  });

  it("renders EmptyCheckoutError immediately when isEmpty=true (no spinner)", () => {
    mockIsEmpty = true;
    render(<CheckoutClient timeWindows={[]} />);

    // EmptyCheckoutError is visible
    expect(screen.getByTestId("empty-checkout-error")).toBeTruthy();
    // No spinner rendered — the loading gate was skipped (auth passed, isEmpty triggered)
    expect(screen.queryByRole("img", { name: /spinner/i })).toBeNull();
    // No stepper — full checkout UI not rendered
    expect(screen.queryByTestId("stepper")).toBeNull();
  });

  it("does NOT call router.replace when isEmpty=true (no redirect — synchronous guard)", () => {
    mockIsEmpty = true;
    render(<CheckoutClient timeWindows={[]} />);

    // The old impl called router.replace("/menu") — CFIX-02 removes this
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it("does NOT render EmptyCheckoutError when isEmpty=false", () => {
    mockIsEmpty = false;
    render(<CheckoutClient timeWindows={[]} />);

    // EmptyCheckoutError not present — normal checkout renders
    expect(screen.queryByTestId("empty-checkout-error")).toBeNull();
    // Stepper is rendered (cart is not empty, auth passes)
    expect(screen.getByTestId("stepper")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// EmptyCheckoutError isolation tests (always run regardless of provider wiring)
// ---------------------------------------------------------------------------

describe("EmptyCheckoutError component isolation (CFIX-02 UI contract)", () => {
  it("has role=status for screen reader announcement", () => {
    render(<RealEmptyCheckoutError />);
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("renders Browse Menu CTA with href /menu", () => {
    render(<RealEmptyCheckoutError />);
    const link = screen.getByRole("link", { name: /browse.*menu/i });
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("/menu");
  });
});

// ---------------------------------------------------------------------------
// Phase 111 CFIX-07 D-03 — reset() gate on unmount (Stripe redirect guard)
// ---------------------------------------------------------------------------

describe("CFIX-07 D-03 — reset() gate on unmount", () => {
  const originalHref = window.location.href;

  beforeEach(() => {
    mockResetFn.mockClear();
    mockIsEmpty = false; // not empty — otherwise EmptyCheckoutError bypasses effects
  });

  afterEach(() => {
    // Restore location.href after every test
    Object.defineProperty(window, "location", {
      writable: true,
      configurable: true,
      value: { ...window.location, href: originalHref },
    });
  });

  it("does NOT reset checkout store when unmounting during Stripe redirect", () => {
    // Render normal checkout
    const { unmount } = render(<CheckoutClient timeWindows={[]} />);

    // Simulate Stripe same-tab redirect by stubbing href BEFORE unmount
    Object.defineProperty(window, "location", {
      writable: true,
      configurable: true,
      value: { ...window.location, href: "https://checkout.stripe.com/pay/cs_test_abc" },
    });

    unmount();

    // Guard must have suppressed reset()
    expect(mockResetFn).not.toHaveBeenCalled();
  });

  it("DOES reset checkout store when unmounting on normal navigation", () => {
    const { unmount } = render(<CheckoutClient timeWindows={[]} />);

    // Normal non-Stripe URL (e.g., navigating to /menu)
    Object.defineProperty(window, "location", {
      writable: true,
      configurable: true,
      value: { ...window.location, href: "http://localhost:3000/menu" },
    });

    unmount();

    // Guard allows reset() on non-Stripe unmount
    expect(mockResetFn).toHaveBeenCalledTimes(1);
  });

  it("sessionStorage 'checkout-store' key is untouched during Stripe-redirect unmount", () => {
    // Seed sessionStorage with the persist-middleware key shape
    const persistPayload = JSON.stringify({
      state: {
        customerName: "Jane Doe",
        customerPhone: "5551234567",
      },
      version: 0,
    });
    sessionStorage.setItem("checkout-store", persistPayload);

    const { unmount } = render(<CheckoutClient timeWindows={[]} />);

    Object.defineProperty(window, "location", {
      writable: true,
      configurable: true,
      value: { ...window.location, href: "https://checkout.stripe.com/pay/cs_test_abc" },
    });

    unmount();

    // The gate prevents reset(); since Zustand persist is mocked out in this
    // test, we assert the raw sessionStorage key is still present (nothing
    // cleared it). The real Zustand persist middleware drives this in prod.
    expect(sessionStorage.getItem("checkout-store")).toBe(persistPayload);
    sessionStorage.removeItem("checkout-store");
  });
});
