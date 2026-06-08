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
import { queryKeys } from "@/lib/queryKeys";

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

// Phase 111 CHKP-03 — useQueryClient is mocked so the step-prefetch tests
// can capture prefetchQuery calls with concrete assertions. Other TanStack
// Query APIs are preserved via importActual so nothing downstream breaks.
const prefetchQuerySpy = vi.fn();
vi.mock("@tanstack/react-query", async () => {
  const actual =
    await vi.importActual<typeof import("@tanstack/react-query")>("@tanstack/react-query");
  return {
    ...actual,
    useQueryClient: () => ({
      prefetchQuery: prefetchQuerySpy,
      getQueryData: vi.fn(),
      setQueryData: vi.fn(),
      invalidateQueries: vi.fn(),
    }),
  };
});

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

// Presentational children pulled in by CheckoutClient that own their own data
// (react-query) / Modal internals — stub them out (this suite is about the
// cart/store/prefetch wiring, not these cards).
vi.mock("@/components/ui/checkout/CheckoutRewardsCard", () => ({
  CheckoutRewardsCard: () => null,
}));
vi.mock("@/components/ui/referrals/OfferBanner", () => ({
  OfferBanner: () => null,
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

// Mock checkout store — stable fn identity + spy accessor for assertions.
// mockStep is a mutable ref so CHKP-03 prefetch tests can flip step per test.
let mockStep: "address" | "time" | "payment" = "address";
const mockResetFn = vi.fn();
const mockSetStepFn = vi.fn();
const mockSetDeliveryFn = vi.fn();
vi.mock("@/lib/stores/checkout-store", () => ({
  useCheckoutStore: () => ({
    step: mockStep,
    setStep: mockSetStepFn,
    reset: mockResetFn,
    setDelivery: mockSetDeliveryFn,
  }),
}));

// Stub all checkout step components
// Import the REAL EmptyCheckoutError before mocking the barrel,
// so the isolation tests below can render the genuine implementation.
import { EmptyCheckoutError as RealEmptyCheckoutError } from "@/components/ui/checkout/EmptyCheckoutError";

// Spy capturing props passed to CheckoutErrorBanner so the CHKP-02 wiring
// tests can assert the synthesized PRICE_CHANGED error AND trigger
// onUpdateCart directly without needing to render the full banner DOM.
const checkoutErrorBannerSpy = vi.fn();

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
  // CHKP-02 — render the synthesized error.code as a testid + render an
  // Update cart button that calls the onUpdateCart prop. Spy captures the
  // full props payload so tests can assert the items array shape.
  CheckoutErrorBanner: (props: {
    error: { code: string; details?: { items?: unknown[]; overallDirection?: string } };
    onUpdateCart?: () => void;
  }) => {
    checkoutErrorBannerSpy(props);
    return (
      <div
        data-testid="checkout-error-banner"
        data-code={props.error.code}
        data-direction={props.error.details?.overallDirection}
      >
        Heads up — prices changed
        <button type="button" onClick={props.onUpdateCart}>
          Update cart
        </button>
      </div>
    );
  },
}));

// Phase 111 CHKP-02 — useCartValidation is mocked via a top-level mutable
// ref so each test can control the priceChangedIds state.
let mockCartValidationReturn: {
  status: "idle" | "validating" | "done" | "error";
  validations: Map<
    string,
    {
      cartItemId: string;
      status: "valid" | "sold-out" | "unavailable" | "price-changed";
      newPriceCents?: number;
      priceDirection?: "up" | "down";
    }
  >;
  priceChangedIds: string[];
  soldOutIds: string[];
  unavailableIds: string[];
  suggestions: Map<string, unknown[]>;
  hasBlockingIssues: boolean;
  timedOut: boolean;
  proceedAnyway: () => void;
} = {
  status: "done",
  validations: new Map(),
  priceChangedIds: [],
  soldOutIds: [],
  unavailableIds: [],
  suggestions: new Map(),
  hasBlockingIssues: false,
  timedOut: false,
  proceedAnyway: vi.fn(),
};

vi.mock("@/lib/hooks/useCartValidation", () => ({
  useCartValidation: () => mockCartValidationReturn,
}));

// Phase 111 CHKP-02 — useCartStore is consumed by CheckoutClient via a
// selector to read items for name/oldPriceCents lookup. Mock with a
// flip-switch ref so individual tests can populate the cart.
let mockCartStoreItems: Array<{
  cartItemId: string;
  nameEn: string;
  basePriceCents: number;
}> = [];

vi.mock("@/lib/stores/cart-store", () => {
  const useCartStore = (
    selector?: (s: { items: typeof mockCartStoreItems }) => unknown
  ): unknown => {
    const state = { items: mockCartStoreItems };
    return selector ? selector(state) : state;
  };
  return { useCartStore };
});

vi.mock("@/components/ui/cart/CartNavigationGuard", () => ({
  CartNavigationGuard: () => null,
}));

// Capture props passed to CutoffModal so reschedule wiring tests can assert
// the composition and trigger onReschedule directly.
const cutoffModalSpy = vi.fn();
vi.mock("@/components/ui/delivery", () => ({
  CutoffModal: (props: Record<string, unknown>) => {
    cutoffModalSpy(props);
    return null;
  },
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

// ---------------------------------------------------------------------------
// Phase 111 CHKP-04 — CutoffModal reschedule wiring
// ---------------------------------------------------------------------------

describe("CHKP-04 — CutoffModal reschedule wiring", () => {
  beforeEach(() => {
    mockResetFn.mockClear();
    mockSetStepFn.mockClear();
    mockSetDeliveryFn.mockClear();
    cutoffModalSpy.mockClear();
    mockIsEmpty = false;
  });

  it("passes undefined rescheduleOption when deliveryDays is empty", () => {
    render(<CheckoutClient timeWindows={[]} deliveryDays={[]} />);

    // Last call captures the final props passed to CutoffModal
    const lastCall = cutoffModalSpy.mock.calls.at(-1);
    expect(lastCall).toBeDefined();
    const props = lastCall![0] as Record<string, unknown>;
    expect(props.rescheduleOption).toBeUndefined();
    expect(typeof props.onReschedule).toBe("function");
  });

  it("computes rescheduleOption when deliveryDays + timeWindows are present", () => {
    const deliveryDays = [
      {
        id: "day-saturday",
        dayOfWeek: 6,
        isActive: true,
        cutoffDay: 5,
        cutoffHour: 15,
        deliveryFeeCents: 1500,
        displayOrder: 0,
        direction: "all" as const,
      },
    ];
    const timeWindows = [{ start: "10:00", end: "12:00", label: "Morning" }];

    render(<CheckoutClient timeWindows={timeWindows} deliveryDays={deliveryDays} />);

    const lastCall = cutoffModalSpy.mock.calls.at(-1);
    expect(lastCall).toBeDefined();
    const props = lastCall![0] as {
      rescheduleOption?: { dateString: string; displayDate: string };
      onReschedule?: () => void;
    };
    expect(props.rescheduleOption).toBeDefined();
    expect(typeof props.rescheduleOption?.dateString).toBe("string");
    expect(props.rescheduleOption?.dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof props.rescheduleOption?.displayDate).toBe("string");
    expect(props.rescheduleOption?.displayDate.length).toBeGreaterThan(0);
    expect(typeof props.onReschedule).toBe("function");
  });

  it("composes setDelivery + setStep('time') on reschedule click (D-31)", () => {
    const deliveryDays = [
      {
        id: "day-saturday",
        dayOfWeek: 6,
        isActive: true,
        cutoffDay: 5,
        cutoffHour: 15,
        deliveryFeeCents: 1500,
        displayOrder: 0,
        direction: "all" as const,
      },
    ];
    const timeWindows = [{ start: "10:00", end: "12:00", label: "Morning" }];

    render(<CheckoutClient timeWindows={timeWindows} deliveryDays={deliveryDays} />);

    // Trigger reschedule directly via the prop the modal received
    const lastCall = cutoffModalSpy.mock.calls.at(-1);
    expect(lastCall).toBeDefined();
    const props = lastCall![0] as {
      rescheduleOption?: { dateString: string; displayDate: string };
      onReschedule: () => void;
    };

    // Sanity-check the option exists before invoking the handler
    expect(props.rescheduleOption).toBeDefined();
    props.onReschedule();

    // Assert all three composition steps fired
    expect(mockSetDeliveryFn).toHaveBeenCalledTimes(1);
    expect(mockSetDeliveryFn).toHaveBeenCalledWith({
      date: props.rescheduleOption!.dateString,
      windowStart: "10:00",
      windowEnd: "12:00",
    });
    expect(mockSetStepFn).toHaveBeenCalledWith("time");
  });

  it("does NOT crash on reschedule when timeWindows is empty (defensive)", () => {
    const deliveryDays = [
      {
        id: "day-saturday",
        dayOfWeek: 6,
        isActive: true,
        cutoffDay: 5,
        cutoffHour: 15,
        deliveryFeeCents: 1500,
        displayOrder: 0,
        direction: "all" as const,
      },
    ];

    render(<CheckoutClient timeWindows={[]} deliveryDays={deliveryDays} />);

    const lastCall = cutoffModalSpy.mock.calls.at(-1);
    const props = lastCall![0] as { onReschedule: () => void };
    // Should be a no-op (early return), not throw
    expect(() => props.onReschedule()).not.toThrow();
    expect(mockSetDeliveryFn).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Phase 111 CHKP-02 — CheckoutClient wires priceChangedIds to PRICE_CHANGED banner
// ---------------------------------------------------------------------------

describe("CHKP-02 — CheckoutClient wires priceChangedIds to PRICE_CHANGED banner", () => {
  beforeEach(() => {
    mockResetFn.mockClear();
    mockSetStepFn.mockClear();
    mockSetDeliveryFn.mockClear();
    mockRouterPush.mockClear();
    checkoutErrorBannerSpy.mockClear();
    mockIsEmpty = false;

    // Default: empty cart + no price changes — tests opt in by reassigning
    mockCartStoreItems = [];
    mockCartValidationReturn = {
      status: "done",
      validations: new Map(),
      priceChangedIds: [],
      soldOutIds: [],
      unavailableIds: [],
      suggestions: new Map(),
      hasBlockingIssues: false,
      timedOut: false,
      proceedAnyway: vi.fn(),
    };
  });

  it("renders CheckoutErrorBanner with PRICE_CHANGED copy when priceChangedIds is non-empty", () => {
    // Seed cart + validation with one price-changed item (up direction)
    mockCartStoreItems = [
      {
        cartItemId: "ci-1",
        nameEn: "Tea Leaf Salad",
        basePriceCents: 1200,
      },
    ];
    mockCartValidationReturn = {
      status: "done",
      validations: new Map([
        [
          "ci-1",
          {
            cartItemId: "ci-1",
            status: "price-changed",
            newPriceCents: 1350,
            priceDirection: "up",
          },
        ],
      ]),
      priceChangedIds: ["ci-1"],
      soldOutIds: [],
      unavailableIds: [],
      suggestions: new Map(),
      hasBlockingIssues: false,
      timedOut: false,
      proceedAnyway: vi.fn(),
    };

    render(<CheckoutClient timeWindows={[]} />);

    // Banner appears with the headline copy from the mocked component
    expect(screen.getByTestId("checkout-error-banner")).toBeTruthy();
    expect(screen.getByText("Heads up — prices changed")).toBeInTheDocument();

    // Spy captured the synthesized error payload
    const lastCall = checkoutErrorBannerSpy.mock.calls.at(-1);
    expect(lastCall).toBeDefined();
    const props = lastCall![0] as {
      error: {
        code: string;
        details: {
          items: Array<{
            name: string;
            oldPriceCents: number;
            newPriceCents: number;
            direction: string;
          }>;
          overallDirection: string;
        };
      };
    };
    expect(props.error.code).toBe("PRICE_CHANGED");
    expect(props.error.details.items).toHaveLength(1);
    expect(props.error.details.items[0]).toEqual({
      name: "Tea Leaf Salad",
      oldPriceCents: 1200,
      newPriceCents: 1350,
      direction: "up",
    });
    expect(props.error.details.overallDirection).toBe("up");
  });

  it("calls router.push('/cart') when Update cart button in banner is clicked", () => {
    mockCartStoreItems = [
      {
        cartItemId: "ci-1",
        nameEn: "Mohinga",
        basePriceCents: 1500,
      },
    ];
    mockCartValidationReturn = {
      status: "done",
      validations: new Map([
        [
          "ci-1",
          {
            cartItemId: "ci-1",
            status: "price-changed",
            newPriceCents: 1300,
            priceDirection: "down",
          },
        ],
      ]),
      priceChangedIds: ["ci-1"],
      soldOutIds: [],
      unavailableIds: [],
      suggestions: new Map(),
      hasBlockingIssues: false,
      timedOut: false,
      proceedAnyway: vi.fn(),
    };

    render(<CheckoutClient timeWindows={[]} />);

    // Click the Update cart button rendered by the mocked banner
    const updateBtn = screen.getByRole("button", { name: /update cart/i });
    updateBtn.click();

    expect(mockRouterPush).toHaveBeenCalledWith("/cart");
  });

  it("does NOT render the banner when priceChangedIds is empty", () => {
    // Default beforeEach state: empty cart, empty priceChangedIds
    render(<CheckoutClient timeWindows={[]} />);

    expect(screen.queryByTestId("checkout-error-banner")).toBeNull();
    expect(screen.queryByText("Heads up — prices changed")).toBeNull();
    expect(checkoutErrorBannerSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Phase 111 CHKP-03 — step prefetch (D-22..D-26)
// ---------------------------------------------------------------------------

describe("CHKP-03 — step prefetch", () => {
  beforeEach(() => {
    prefetchQuerySpy.mockClear();
    mockIsEmpty = false;
    mockStep = "address";
    // Reset cart validation + store items so the CHKP-02 banner path does
    // not interfere with prefetch assertions.
    mockCartStoreItems = [];
    mockCartValidationReturn = {
      status: "done",
      validations: new Map(),
      priceChangedIds: [],
      soldOutIds: [],
      unavailableIds: [],
      suggestions: new Map(),
      hasBlockingIssues: false,
      timedOut: false,
      proceedAnyway: vi.fn(),
    };
  });

  afterEach(() => {
    mockStep = "address";
  });

  it("prefetches menu.list() on step='address'", () => {
    mockStep = "address";

    render(<CheckoutClient timeWindows={[]} />);

    // Expect a prefetch call with the menu.list() key and the shared queryFn
    const menuCall = prefetchQuerySpy.mock.calls.find(
      (c) =>
        JSON.stringify((c[0] as { queryKey: unknown }).queryKey) ===
        JSON.stringify(queryKeys.menu.list())
    );
    expect(menuCall).toBeDefined();
    const args = menuCall![0] as {
      queryKey: unknown;
      queryFn: unknown;
      staleTime?: number;
    };
    expect(args.queryKey).toEqual(queryKeys.menu.list());
    expect(typeof args.queryFn).toBe("function");
    expect(args.staleTime).toBe(5 * 60 * 1000);
  });

  it("prefetches addresses.list() on step='time'", () => {
    mockStep = "time";

    render(<CheckoutClient timeWindows={[]} />);

    const addrCall = prefetchQuerySpy.mock.calls.find(
      (c) =>
        JSON.stringify((c[0] as { queryKey: unknown }).queryKey) ===
        JSON.stringify(queryKeys.addresses.list())
    );
    expect(addrCall).toBeDefined();
    const args = addrCall![0] as {
      queryKey: unknown;
      queryFn: unknown;
      staleTime?: number;
    };
    expect(args.queryKey).toEqual(queryKeys.addresses.list());
    expect(typeof args.queryFn).toBe("function");
    expect(args.staleTime).toBe(5 * 60 * 1000);
  });

  it("does NOT prefetch on step='payment'", () => {
    mockStep = "payment";

    render(<CheckoutClient timeWindows={[]} />);

    // Neither menu nor addresses prefetch should fire on the terminal step
    const menuCall = prefetchQuerySpy.mock.calls.find(
      (c) =>
        JSON.stringify((c[0] as { queryKey: unknown } | undefined)?.queryKey) ===
        JSON.stringify(queryKeys.menu.list())
    );
    const addrCall = prefetchQuerySpy.mock.calls.find(
      (c) =>
        JSON.stringify((c[0] as { queryKey: unknown } | undefined)?.queryKey) ===
        JSON.stringify(queryKeys.addresses.list())
    );
    expect(menuCall).toBeUndefined();
    expect(addrCall).toBeUndefined();
  });

  it("does NOT prefetch when cart is empty", () => {
    mockIsEmpty = true;
    mockStep = "address";

    render(<CheckoutClient timeWindows={[]} />);

    // Empty cart short-circuits to EmptyCheckoutError before any prefetch
    // effect runs — but even if the effect ran, the isEmpty guard blocks it.
    expect(prefetchQuerySpy).not.toHaveBeenCalled();
  });
});
