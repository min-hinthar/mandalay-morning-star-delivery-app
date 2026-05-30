"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCart } from "@/lib/hooks/useCart";
import { useCartStore } from "@/lib/stores/cart-store";
import { useCartValidation } from "@/lib/hooks/useCartValidation";
import { useNavigationGuard } from "@/lib/hooks/useNavigationGuard";
import { useCheckoutStore } from "@/lib/stores/checkout-store";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useDeliveryGate, useDeliveryGateMultiDay } from "@/lib/hooks/useDeliveryGate";
import { menuQueryFn } from "@/lib/hooks/useMenu";
import { addressesQueryFn } from "@/lib/hooks/useAddresses";
import { CartNavigationGuard } from "@/components/ui/cart/CartNavigationGuard";
import { CutoffModal } from "@/components/ui/delivery";
import { getNextDeliveryDate } from "@/lib/utils/delivery-dates";
import { spring } from "@/lib/motion-tokens";
import {
  CheckoutStepperV8,
  AddressStep,
  TimeStep,
  PaymentStep,
  CheckoutSummary,
  EmptyCheckoutError,
  CheckoutErrorBanner,
} from "@/components/ui/checkout";
import { OfferBanner } from "@/components/ui/referrals/OfferBanner";
import type { CheckoutStep } from "@/types/checkout";
import type { DeliveryDayConfig, DeliveryZoneConfig, TimeWindow } from "@/types/delivery";

/**
 * Direction-aware step transition variants with scale morph and glow
 * - Forward (1): current slides left, new slides from right
 * - Backward (-1): current slides right, new slides from left
 * - Scale morph gives premium feel to transitions
 * - Subtle glow enhances visual interest
 *
 * Note: boxShadow values are ~--shadow-glow-primary equivalent,
 * kept numeric for Framer Motion interpolation between states.
 */
/* eslint-disable no-restricted-syntax -- FM animation needs numeric boxShadow for interpolation */
const stepVariants = {
  initial: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 100 : -100,
    scale: 0.95,
  }),
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    boxShadow: "0 0 30px rgba(164, 16, 52, 0.08)", // ~--shadow-glow-primary light
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -100 : 100,
    scale: 0.95,
    boxShadow: "0 0 0px rgba(164, 16, 52, 0)",
  }),
};
/* eslint-enable no-restricted-syntax */

const STEPS: CheckoutStep[] = ["address", "time", "payment"];

interface CheckoutClientProps {
  timeWindows: TimeWindow[];
  /** Cutoff day of week (0=Sun..6=Sat). Defaults to Friday (5). */
  cutoffDay?: number;
  /** Cutoff hour (0-23). Defaults to 15 (3 PM). */
  cutoffHour?: number;
  /** Multi-day delivery configs */
  deliveryDays?: DeliveryDayConfig[];
  /** Delivery zone configs for direction display */
  deliveryZones?: DeliveryZoneConfig[];
  /** Whether Cash on Delivery is enabled */
  codEnabled?: boolean;
}

export default function CheckoutClient({
  timeWindows,
  cutoffDay = 5,
  cutoffHour = 15,
  deliveryDays = [],
  deliveryZones = [],
  codEnabled = false,
}: CheckoutClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const { isEmpty } = useCart();
  const { step, setStep, reset, setDelivery } = useCheckoutStore();
  const { shouldAnimate, getSpring } = useAnimationPreference();

  // Use multi-day gate when delivery days are configured, legacy otherwise
  const hasMultiDay = deliveryDays.length > 0;
  const legacyGate = useDeliveryGate(cutoffDay, cutoffHour);
  const multiDayGate = useDeliveryGateMultiDay(deliveryDays);
  const gate = hasMultiDay ? multiDayGate : legacyGate;

  const [showCutoffModal, setShowCutoffModal] = useState(false);

  // Phase 111 CHKP-04 D-30 — compute next available delivery for the
  // cutoff modal reschedule action. Uses Phase 106 timezone-correct
  // helper (NEVER use getUTCDay() — LA timezone bug).
  const nextDelivery = useMemo(() => {
    if (deliveryDays.length === 0) return undefined;
    const next = getNextDeliveryDate(new Date(), deliveryDays);
    if (!next) return undefined;
    // Build local-date ISO string (YYYY-MM-DD) — NOT toISOString()
    // (which would shift days near UTC midnight in LA timezone).
    const year = next.getFullYear();
    const month = String(next.getMonth() + 1).padStart(2, "0");
    const day = String(next.getDate()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}`;
    const displayDate = next.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    return { dateString, displayDate };
  }, [deliveryDays]);

  // Phase 111 CHKP-04 D-31 — compose setDelivery + setStep("time") + close modal.
  // Missing ANY of these three breaks the UX per D-31. D-32: auto-pick the
  // first time window (mirrors TimeStepV8.tsx:135-140 default-selection
  // pattern; DeliveryDayConfig has no per-day windows array — windows are
  // global). D-33: navigate to "time" step (not payment) so customer reviews
  // the new window before re-committing to payment.
  const handleReschedule = useCallback(() => {
    if (!nextDelivery) return;
    if (timeWindows.length === 0) return;
    const firstWindow = timeWindows[0];
    setDelivery({
      date: nextDelivery.dateString,
      windowStart: firstWindow.start,
      windowEnd: firstWindow.end,
    });
    setStep("time");
    setShowCutoffModal(false);
  }, [nextDelivery, timeWindows, setDelivery, setStep]);

  // Phase 111 CFIX-09 + CHKP-02 — Live menu validation detects price changes
  // from polling. When non-empty, render PRICE_CHANGED banner explaining
  // old vs new price per item. Dismissal navigates to /cart.
  //
  // CartItemValidation only carries { cartItemId, status, newPriceCents?,
  // priceDirection? } — name + oldPriceCents come from the cart item itself
  // (CartItem.nameEn / CartItem.basePriceCents). The map below joins the
  // priceChangedIds list against the live cart items + validations.
  const cartItems = useCartStore((s) => s.items);
  const cartValidation = useCartValidation();
  const hasPriceChanges =
    cartValidation.status === "done" && cartValidation.priceChangedIds.length > 0;

  const priceChangeError = useMemo(() => {
    if (!hasPriceChanges || cartValidation.status !== "done") return null;
    const items = cartValidation.priceChangedIds
      .map((cartItemId) => {
        const v = cartValidation.validations.get(cartItemId);
        const cartItem = cartItems.find((ci) => ci.cartItemId === cartItemId);
        if (
          !v ||
          !cartItem ||
          v.newPriceCents == null ||
          !v.priceDirection ||
          v.status !== "price-changed"
        ) {
          return null;
        }
        return {
          name: cartItem.nameEn,
          oldPriceCents: cartItem.basePriceCents,
          newPriceCents: v.newPriceCents,
          direction: v.priceDirection,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (items.length === 0) return null;

    // Dominant direction: up if any item went up (safer default per UI-SPEC
    // state matrix — "Multi item, mixed directions → Warning banner").
    const overallDirection: "up" | "down" = items.some((it) => it.direction === "up")
      ? "up"
      : "down";

    return {
      code: "PRICE_CHANGED",
      message: "Prices updated since you added items to your cart",
      details: { items, overallDirection },
    };
  }, [hasPriceChanges, cartValidation, cartItems]);

  const handleUpdateCart = useCallback(() => {
    router.push("/cart");
  }, [router]);

  // Navigation guard: warn when leaving checkout with items in cart
  const {
    showModal,
    proceed,
    cancel,
    disable: disableGuard,
  } = useNavigationGuard({
    enabled: !isEmpty,
    allowedPaths: ["/checkout"],
    allowBackNavigation: true,
  });

  // Track direction for step transitions using ref for synchronous access
  const directionRef = useRef(1);
  const [, forceUpdate] = useState({});

  // Get current direction value
  const direction = directionRef.current;

  // Navigation handlers that set direction synchronously before step change.
  // Read step from getState() to avoid stale closure issues.
  const goToNextStep = () => {
    const currentStep = useCheckoutStore.getState().step;
    directionRef.current = 1;
    forceUpdate({});
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setStep(STEPS[currentIndex + 1]);
    }
  };

  const goToPrevStep = () => {
    const currentStep = useCheckoutStore.getState().step;
    directionRef.current = -1;
    forceUpdate({});
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setStep(STEPS[currentIndex - 1]);
    }
  };

  // Show CutoffModal when ordering closes (on mount if past cutoff, or mid-session when gate flips)
  useEffect(() => {
    if (!gate.isOpen) {
      setShowCutoffModal(true);
    }
  }, [gate.isOpen]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?next=/checkout");
    }
  }, [user, authLoading, router]);

  // Phase 110 CFIX-02 D-04/D-05: render-time empty-cart guard below has
  // replaced the previous useEffect + router redirect to /menu. The direct
  // selector pattern `useCart((s) => s.items.length === 0)` returns the
  // EmptyCheckoutError component synchronously with no spinner, no redirect,
  // and no flash cycle.

  // Phase 111 CFIX-07 D-03 — Do NOT reset checkout state when the user is
  // being redirected to Stripe. Stripe checkout uses same-tab navigation
  // (usePaymentSubmit.ts:203: window.location.href = sessionUrl), which
  // triggers React unmount synchronously BEFORE the browser navigates.
  // Without this guard, reset() clears sessionStorage and breaks CFIX-07
  // form persistence across payment errors / manual back-navigation from
  // Stripe. Reset still fires on normal unmount paths (logout, /menu nav,
  // tab close — though tab close also purges sessionStorage anyway).
  useEffect(() => {
    return () => {
      if (typeof window === "undefined") return;
      const isStripeRedirect = window.location.href.includes("checkout.stripe.com");
      if (!isStripeRedirect) {
        reset();
      }
    };
  }, [reset]);

  // Phase 111 CHKP-03 D-22..D-26 — Silent background prefetch of next-step
  // data. Uses the Phase 110 query key factory (D-26) and the useQueryClient()
  // hook (D-23 — NEVER reach for the QueryClient ref directly; it is local
  // useState in the provider, not a module export).
  //
  // CRITICAL: queryFn references MUST be the SAME named exports that the
  // consumer hooks use (menuQueryFn from useMenu, addressesQueryFn from
  // useAddresses). Divergent inline queryFns break the TanStack Query dedup
  // contract and risk shape mismatches between cached prefetch result and
  // consumer hook expectations.
  //
  // - step="address" → prefetch menu.list() (typing window: 30-120s)
  // - step="time"    → prefetch addresses.list() (for payment step prefill)
  // - step="payment" → no prefetch (terminal step)
  //
  // D-19 precedent: guard on isEmpty to avoid polling empty cart.
  // D-24: no `void` prefix — Vercel kills fire-and-forget. The implicit
  // promise return from prefetchQuery inside the effect callback is fine;
  // prefetchQuery swallows errors silently (D-25 — benign background work).
  useEffect(() => {
    if (isEmpty) return;
    if (step === "address") {
      queryClient.prefetchQuery({
        queryKey: queryKeys.menu.list(),
        queryFn: menuQueryFn,
        staleTime: 5 * 60 * 1000,
      });
    } else if (step === "time") {
      queryClient.prefetchQuery({
        queryKey: queryKeys.addresses.list(),
        queryFn: addressesQueryFn,
        staleTime: 5 * 60 * 1000,
      });
    }
    // No prefetch on step === "payment" — terminal step per D-22.
  }, [step, isEmpty, queryClient]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // CFIX-02 D-05: synchronous render-time empty guard — no useEffect.
  if (isEmpty) {
    return <EmptyCheckoutError />;
  }

  const handleStepClick = (clickedStep: CheckoutStep) => {
    const currentIndex = STEPS.indexOf(step);
    const clickedIndex = STEPS.indexOf(clickedStep);

    // Only allow going back
    if (clickedIndex < currentIndex) {
      directionRef.current = -1;
      forceUpdate({});
      setStep(clickedStep);
    }
  };

  return (
    <div className="min-h-screen bg-surface-secondary pb-32">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
        <h1 className="mb-6 text-xl sm:text-2xl font-display font-bold text-text-primary">
          Checkout
        </h1>

        <CheckoutStepperV8
          currentStep={step}
          onStepClick={handleStepClick}
          className="mb-6 sm:mb-8"
        />

        {/* Welcome + referral offers (first-order discount auto-applies at payment) */}
        <OfferBanner source="checkout" className="mb-6" />

        {/* Phase 111 CHKP-02 — Price change banner, rendered above step content */}
        {priceChangeError && (
          <div className="mb-6">
            <CheckoutErrorBanner error={priceChangeError} onUpdateCart={handleUpdateCart} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-3">
          {/* Main content - order form with animated transitions */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-border bg-surface-primary p-4 sm:p-6 shadow-colorful overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                {step === "address" && (
                  <m.div
                    key="address"
                    custom={direction}
                    variants={stepVariants}
                    initial={shouldAnimate ? "initial" : false}
                    animate="animate"
                    exit={shouldAnimate ? "exit" : undefined}
                    transition={{
                      x: getSpring(spring.default),
                      scale: getSpring(spring.gentle),
                      opacity: { duration: 0.2 },
                      boxShadow: { duration: 0.3 },
                    }}
                  >
                    <AddressStep onNext={goToNextStep} deliveryZones={deliveryZones} />
                  </m.div>
                )}
                {step === "time" && (
                  <m.div
                    key="time"
                    custom={direction}
                    variants={stepVariants}
                    initial={shouldAnimate ? "initial" : false}
                    animate="animate"
                    exit={shouldAnimate ? "exit" : undefined}
                    transition={{
                      x: getSpring(spring.default),
                      scale: getSpring(spring.gentle),
                      opacity: { duration: 0.2 },
                      boxShadow: { duration: 0.3 },
                    }}
                  >
                    <TimeStep
                      onNext={goToNextStep}
                      onBack={goToPrevStep}
                      timeWindows={timeWindows}
                      deliveryDays={deliveryDays}
                      deliveryZones={deliveryZones}
                    />
                  </m.div>
                )}
                {step === "payment" && (
                  <m.div
                    key="payment"
                    custom={direction}
                    variants={stepVariants}
                    initial={shouldAnimate ? "initial" : false}
                    animate="animate"
                    exit={shouldAnimate ? "exit" : undefined}
                    transition={{
                      x: getSpring(spring.default),
                      scale: getSpring(spring.gentle),
                      opacity: { duration: 0.2 },
                      boxShadow: { duration: 0.3 },
                    }}
                  >
                    <PaymentStep
                      onBack={goToPrevStep}
                      disableGuard={disableGuard}
                      timeWindows={timeWindows}
                      onCutoffPassed={() => setShowCutoffModal(true)}
                      codEnabled={codEnabled}
                      cutoffModalOpen={showCutoffModal}
                    />
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Order summary - sticky on desktop */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <CheckoutSummary />
            </div>
          </div>
        </div>
      </div>

      <CartNavigationGuard
        isOpen={showModal}
        onStay={cancel}
        onLeave={proceed}
        variant="checkout"
      />

      <CutoffModal
        isOpen={showCutoffModal}
        onClose={() => setShowCutoffModal(false)}
        nextDeliveryDate={gate.deliveryDate.displayDate}
        rescheduleOption={nextDelivery}
        onReschedule={handleReschedule}
      />
    </div>
  );
}
