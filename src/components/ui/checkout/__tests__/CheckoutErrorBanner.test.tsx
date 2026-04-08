/**
 * Phase 111 CHKP-02 — CheckoutErrorBanner PRICE_CHANGED case.
 *
 * Contract under test:
 *   1. Direction "up" → warning headline "Heads up — prices changed"
 *   2. Direction "down" → success headline "Good news — prices dropped"
 *   3. Multi-item banner renders ALL price rows inline via formatPrice
 *   4. Update cart click invokes onUpdateCart prop
 *   5. role=status + aria-live=polite (NOT assertive — UI-SPEC §Accessibility)
 *   6. Burmese companion string rendered with lang=my
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// Mock framer-motion with the Plan 02 canonical forwardRef + motion-only-prop
// blacklist pattern. This strips animation-only props (initial/animate/exit/etc)
// but forwards everything else (role, aria-live, className) to the DOM node.
vi.mock("framer-motion", () => {
  const MOTION_ONLY_PROPS = new Set([
    "initial",
    "animate",
    "exit",
    "variants",
    "transition",
    "whileHover",
    "whileTap",
    "whileFocus",
    "whileDrag",
    "whileInView",
    "layout",
    "layoutId",
    "drag",
    "dragConstraints",
    "dragElastic",
    "onAnimationStart",
    "onAnimationComplete",
    "onViewportEnter",
    "onViewportLeave",
  ]);
  function motionComp(tag: string) {
    const Comp = React.forwardRef(
      ({ children, ...props }: Record<string, unknown>, ref: React.Ref<unknown>) => {
        const filtered: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(props)) {
          if (!MOTION_ONLY_PROPS.has(k)) {
            filtered[k] = v;
          }
        }
        const Tag = tag as unknown as React.ElementType;
        return (
          <Tag ref={ref} {...filtered}>
            {children as React.ReactNode}
          </Tag>
        );
      }
    );
    Comp.displayName = `motion.${tag}`;
    return Comp;
  }
  const proxy = new Proxy({}, { get: (_t, p) => motionComp(String(p)) });
  return {
    m: proxy,
    motion: proxy,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useReducedMotion: () => false,
  };
});

// No animations in tests
vi.mock("@/lib/hooks/useAnimationPreference", () => ({
  useAnimationPreference: () => ({ shouldAnimate: false, getSpring: (v: unknown) => v }),
}));

import { CheckoutErrorBanner } from "@/components/ui/checkout/CheckoutErrorBanner";

describe("CHKP-02 — CheckoutErrorBanner PRICE_CHANGED case", () => {
  const priceUpError = {
    code: "PRICE_CHANGED",
    message: "Price updated",
    details: {
      items: [
        {
          name: "Tea Leaf Salad",
          oldPriceCents: 1200,
          newPriceCents: 1350,
          direction: "up" as const,
        },
      ],
      overallDirection: "up" as const,
    },
  };

  const priceDownError = {
    code: "PRICE_CHANGED",
    message: "Price updated",
    details: {
      items: [
        {
          name: "Mohinga",
          oldPriceCents: 1500,
          newPriceCents: 1300,
          direction: "down" as const,
        },
      ],
      overallDirection: "down" as const,
    },
  };

  const mixedError = {
    code: "PRICE_CHANGED",
    message: "Price updated",
    details: {
      items: [
        {
          name: "Tea Leaf Salad",
          oldPriceCents: 1200,
          newPriceCents: 1350,
          direction: "up" as const,
        },
        {
          name: "Mohinga",
          oldPriceCents: 1500,
          newPriceCents: 1300,
          direction: "down" as const,
        },
      ],
      overallDirection: "up" as const,
    },
  };

  it("renders warning headline for direction up", () => {
    render(<CheckoutErrorBanner error={priceUpError} />);
    expect(screen.getByText("Heads up — prices changed")).toBeInTheDocument();
  });

  it("renders success headline for direction down", () => {
    render(<CheckoutErrorBanner error={priceDownError} />);
    expect(screen.getByText("Good news — prices dropped")).toBeInTheDocument();
  });

  it("renders all price rows for multi-item mixed banner using formatPrice", () => {
    render(<CheckoutErrorBanner error={mixedError} />);
    // Both item names present (matched inside li)
    expect(screen.getByText(/Tea Leaf Salad/)).toBeInTheDocument();
    expect(screen.getByText(/Mohinga/)).toBeInTheDocument();
    // formatPrice produces Intl-formatted strings — "$12.00", "$13.50", etc.
    expect(screen.getByText("$12.00")).toBeInTheDocument();
    expect(screen.getByText("$13.50")).toBeInTheDocument();
    expect(screen.getByText("$15.00")).toBeInTheDocument();
    expect(screen.getByText("$13.00")).toBeInTheDocument();
  });

  it("invokes onUpdateCart when Update cart clicked", () => {
    const onUpdateCart = vi.fn();
    render(<CheckoutErrorBanner error={priceUpError} onUpdateCart={onUpdateCart} />);
    fireEvent.click(screen.getByRole("button", { name: /update cart/i }));
    expect(onUpdateCart).toHaveBeenCalledTimes(1);
  });

  it("has role=status and aria-live=polite for PRICE_CHANGED (not rude interruption)", () => {
    const { container } = render(<CheckoutErrorBanner error={priceUpError} />);
    const statusEl = container.querySelector('[role="status"]');
    expect(statusEl).toBeTruthy();
    expect(statusEl?.getAttribute("aria-live")).toBe("polite");
  });

  it("renders Burmese companion string marked with lang=my", () => {
    const { container } = render(<CheckoutErrorBanner error={priceUpError} />);
    const myLang = container.querySelector('[lang="my"]');
    expect(myLang).toBeTruthy();
    expect(myLang?.textContent).toMatch(/စျေးနှုန်း/);
  });
});
