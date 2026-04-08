/**
 * Phase 111 CHKP-01 — Inline validation contract for checkout contact info.
 *
 * Tests that ContactInfoSection (which is the only text-input form inside
 * PaymentStepV8) is fully migrated to react-hook-form with mode: "onTouched"
 * per D-06 — no touched-state shim, no phoneDisplay local state, real RHF
 * Controller wiring. These tests render ContactInfoSection directly with a
 * saveToProfileRef to avoid mounting the full PaymentStepV8 dependency tree.
 *
 * The contract under test:
 *   1. Empty untouched field shows NO error (mode onTouched gate)
 *   2. After first blur, invalid field shows the Zod error message
 *   3. Subsequent keystrokes re-validate in real time (touched -> onChange)
 *   4. Phone formats as (xxx) xxx-xxxx while raw digits drive validation
 *   5. RHF values propagate DOWN into useCheckoutStore via watch() bridge
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { ContactInfoSection } from "@/components/ui/checkout/ContactInfoSection";
import { useCheckoutStore } from "@/lib/stores/checkout-store";

// Mock framer-motion to avoid animation machinery in jsdom.
// Strip only the motion-specific animation props (initial/animate/exit/etc)
// but pass EVERYTHING else through — id, type, value, onChange, onBlur, ref,
// placeholder, maxLength are all needed for RHF Controller + label queries.
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

// Mock the Input component to bypass framer-motion's m.input entirely.
// The real Input wraps <m.input> from framer-motion, which in jsdom doesn't
// reliably forward value/onChange/onBlur through to the underlying DOM node.
// Since CHKP-01 tests the RHF Controller contract (not the Input visual chrome),
// a plain forwardRef'd <input> is a valid stand-in that preserves ref + all props.
vi.mock("@/components/ui/input", () => ({
  // eslint-disable-next-line react/display-name
  Input: React.forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement> & {
      error?: boolean;
      helperText?: string;
      variant?: string;
    }
  >(({ error: _error, helperText: _helperText, variant: _variant, ...props }, ref) => (
    <input ref={ref} {...props} />
  )),
}));

// Mock useAnimationPreference (no animations in tests)
vi.mock("@/lib/hooks/useAnimationPreference", () => ({
  useAnimationPreference: () => ({ shouldAnimate: false, getSpring: (v: unknown) => v }),
}));

function renderContactInfoSection() {
  const saveToProfileRef = { current: false };
  return render(<ContactInfoSection saveToProfileRef={saveToProfileRef} />);
}

describe("CHKP-01 — ContactInfoSection RHF onTouched validation", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    // Reset store between tests
    useCheckoutStore.getState().reset();
    // Mock profile fetch — return empty so auto-fill does NOT pre-populate name/phone.
    // Tests exercise the "user types into empty fields" flow.
    originalFetch = global.fetch;
    fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { fullName: null, phone: null } }),
    });
    global.fetch = fetchSpy as unknown as typeof global.fetch;
    if (typeof window !== "undefined") {
      sessionStorage.clear();
    }
  });

  afterEach(() => {
    global.fetch = originalFetch;
    cleanup();
    vi.clearAllMocks();
  });

  it("shows NO error on freshly rendered empty name field (untouched)", async () => {
    renderContactInfoSection();
    // Wait for profile fetch effect to settle
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });
    // No error alert should appear — field is untouched
    const alerts = screen.queryAllByRole("alert");
    const customerNameErr = alerts.find((el) => el.id === "customerName-error");
    expect(customerNameErr).toBeUndefined();
  });

  it("shows error AFTER first blur if name invalid (RHF onTouched gate)", async () => {
    const user = userEvent.setup();
    renderContactInfoSection();
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    const nameInput = screen.getByLabelText(/full name/i);
    // Type 1 char then tab away (blur)
    await user.click(nameInput);
    await user.type(nameInput, "J");
    await user.tab();

    // Error should now appear after blur
    await waitFor(() => {
      const err = document.getElementById("customerName-error");
      expect(err).not.toBeNull();
      expect(err?.textContent).toMatch(/at least 2 characters/i);
    });
  });

  it("clears error in real-time after first blur when name becomes valid", async () => {
    const user = userEvent.setup();
    renderContactInfoSection();
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    const nameInput = screen.getByLabelText(/full name/i);
    await user.click(nameInput);
    await user.type(nameInput, "J");
    await user.tab();

    // Error appears
    await waitFor(() => {
      expect(document.getElementById("customerName-error")).not.toBeNull();
    });

    // Re-focus and type more — error clears on each keystroke after touched
    await user.click(nameInput);
    await user.type(nameInput, "ane");
    await waitFor(() => {
      expect(document.getElementById("customerName-error")).toBeNull();
    });
  });

  it("phone field mirrors the same onTouched behavior with formatted display", async () => {
    const user = userEvent.setup();
    renderContactInfoSection();
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    const phoneInput = screen.getByLabelText(/phone number/i) as HTMLInputElement;
    await user.click(phoneInput);
    await user.type(phoneInput, "5");
    await user.tab();

    // Error after blur
    await waitFor(() => {
      const err = document.getElementById("customerPhone-error");
      expect(err).not.toBeNull();
      expect(err?.textContent).toMatch(/10-digit phone/i);
    });

    // Finish typing 10 digits — error clears and display formats
    await user.click(phoneInput);
    await user.type(phoneInput, "551234567");
    await waitFor(() => {
      expect(document.getElementById("customerPhone-error")).toBeNull();
    });
    // Formatted display shows (555) 123-4567
    expect(phoneInput.value).toBe("(555) 123-4567");
    // Underlying form/store state holds raw digits
    expect(useCheckoutStore.getState().customerPhone).toBe("5551234567");
  });

  it("propagates RHF values to useCheckoutStore via watch + useEffect", async () => {
    const user = userEvent.setup();
    renderContactInfoSection();
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    const nameInput = screen.getByLabelText(/full name/i);
    const phoneInput = screen.getByLabelText(/phone number/i);

    await user.click(nameInput);
    await user.type(nameInput, "Jane Doe");
    await user.click(phoneInput);
    await user.type(phoneInput, "5551234567");

    await waitFor(() => {
      expect(useCheckoutStore.getState().customerName).toBe("Jane Doe");
      expect(useCheckoutStore.getState().customerPhone).toBe("5551234567");
    });
  });
});
