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
import { getNextDeliveryDate, CUTOFF_SAFETY_BUFFER_MS } from "@/lib/utils/delivery-dates";
import { getDirectionsForCoords, filterDaysByDirection } from "@/lib/utils/delivery-zones";
import { resolveSelectedCutoff } from "@/components/ui/checkout/SelectedCutoffChip";
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
import { CheckoutBackdrop } from "@/components/ui/checkout/CheckoutBackdrop";
import { CheckoutMasthead } from "@/components/ui/checkout/CheckoutMasthead";
import { CheckoutRewardsCard } from "@/components/ui/checkout/CheckoutRewardsCard";
import { HeroCardLayers } from "@/components/ui/homepage/Hero/HeroCardLayers";
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
  const { step, setStep, reset, setDelivery, address, delivery } = useCheckoutStore();
  const { shouldAnimate, getSpring } = useAnimationPreference();

  // Address-aware day list: once an address is placed, every date this
  // component reasons about (gate, modal's "next chance", reschedule target)
  // must come from the days that actually serve it — the all-days list quotes
  // deadlines and dates for runs that may not drive the customer's way.
  // Mirrors TimeStepV8's filtering; `undefined` directions = no placeable
  // address yet, `[]` = nearby (keeps every day via filterDaysByDirection).
  const addressDirections = useMemo(() => {
    if (address?.lat == null || address?.lng == null || deliveryZones.length === 0)
      return undefined;
    return getDirectionsForCoords(address.lat, address.lng, deliveryZones);
  }, [address?.lat, address?.lng, deliveryZones]);

  // Active rows only — mirrors TimeStepV8: an inactive row must neither count
  // as "serving" nor defeat the no-serve detection.
  const activeDays = useMemo(() => deliveryDays.filter((d) => d.isActive), [deliveryDays]);

  const gateDays = useMemo(
    () => (addressDirections ? filterDaysByDirection(addressDirections, activeDays) : activeDays),
    [addressDirections, activeDays]
  );

  // No ACTIVE run serves the placed address — TimeStep renders its empty
  // state; the CutoffModal ("ordering closed, next chance is…") would be the
  // wrong story. With zero active days overall (legacy config, or every run
  // switched off) this stays false so the legacy gate / closed-modal paths
  // keep working.
  const noServe = activeDays.length > 0 && addressDirections !== undefined && gateDays.length === 0;

  // Use multi-day gate when delivery days are configured, legacy otherwise
  const hasMultiDay = deliveryDays.length > 0;
  const legacyGate = useDeliveryGate(cutoffDay, cutoffHour);
  const multiDayGate = useDeliveryGateMultiDay(gateDays.length > 0 ? gateDays : deliveryDays);
  const gate = hasMultiDay ? multiDayGate : legacyGate;

  const [showCutoffModal, setShowCutoffModal] = useState(false);

  // Phase 111 CHKP-04 D-30 — compute next available delivery for the
  // cutoff modal reschedule action. Uses Phase 106 timezone-correct
  // helper (NEVER use getUTCDay() — LA timezone bug). Address-aware: the
  // reschedule target must be a day that serves the customer's address.
  const computeNextDelivery = useCallback(() => {
    if (gateDays.length === 0) return undefined;
    const next = getNextDeliveryDate(new Date(), gateDays);
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
  }, [gateDays]);

  // Wall-clock-derived, so it goes stale sitting in a memo: a checkout mounted
  // at 2:50pm caches the imminent run; when the watcher opens the modal at
  // 3pm, the button would still offer the now-closed date. `showCutoffModal`
  // in the deps re-derives it at the moment it becomes visible.
  const nextDelivery = useMemo(
    () => computeNextDelivery(),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- showCutoffModal forces a fresh wall-clock read on open
    [computeNextDelivery, showCutoffModal]
  );

  // Phase 111 CHKP-04 D-31 — compose setDelivery + setStep("time") + close modal.
  // Missing ANY of these three breaks the UX per D-31. D-32: auto-pick the
  // first time window (mirrors TimeStepV8.tsx:135-140 default-selection
  // pattern; DeliveryDayConfig has no per-day windows array — windows are
  // global). D-33: navigate to "time" step (not payment) so customer reviews
  // the new window before re-committing to payment.
  const handleReschedule = useCallback(() => {
    // Recompute at CLICK time — the displayed option may itself have aged
    // while the modal sat open; the action must never seat a closed run.
    const freshNext = computeNextDelivery();
    if (!freshNext) return;
    if (timeWindows.length === 0) return;
    const firstWindow = timeWindows[0];
    setDelivery({
      date: freshNext.dateString,
      windowStart: firstWindow.start,
      windowEnd: firstWindow.end,
    });
    setStep("time");
    setShowCutoffModal(false);
  }, [computeNextDelivery, timeWindows, setDelivery, setStep]);

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

  // Shared motion props for the three step panes (kept identical so the
  // swipe transition is consistent). Each pane keeps its own literal `key`.
  const stepMotion = {
    custom: direction,
    variants: stepVariants,
    initial: shouldAnimate ? ("initial" as const) : false,
    animate: "animate" as const,
    exit: shouldAnimate ? ("exit" as const) : undefined,
    transition: {
      x: getSpring(spring.default),
      scale: getSpring(spring.gentle),
      opacity: { duration: 0.2 },
      boxShadow: { duration: 0.3 },
    },
  };

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

  // Show CutoffModal when ordering closes (on mount if past cutoff, or mid-session
  // when gate flips). Suppressed for a no-serve address — TimeStep's empty state
  // owns that story ("no runs your way"), not "ordering closed until {date}".
  useEffect(() => {
    if (!gate.isOpen && !noServe) {
      setShowCutoffModal(true);
    }
  }, [gate.isOpen, noServe]);

  // Proactively surface the modal the moment the SELECTED date's own cutoff
  // passes. The multi-day gate above rolls to the next open run when one
  // closes, so its isOpen almost never flips mid-session — without this arm,
  // a customer who picked Saturday at 2:50pm Friday types name/phone/tip and
  // learns about the miss only from the server's CUTOFF_PASSED at Place
  // Order. One timeout to (cutoff − safety buffer), re-checked against the
  // live store so a reseated date (TimeStep revalidation) can't fire a stale
  // modal.
  const selectedCutoffMs = useMemo(() => {
    const dateStr = delivery?.date;
    if (!dateStr || deliveryDays.length === 0) return null;
    const cutoff = resolveSelectedCutoff(dateStr, deliveryDays);
    return cutoff ? cutoff.getTime() - CUTOFF_SAFETY_BUFFER_MS : null;
  }, [delivery?.date, deliveryDays]);

  // Sticky "the selected date's cutoff HAS passed" state — the modal alone
  // isn't enough: dismissing it with "Got it" would re-enable Place Order
  // while the expired date is still selected (the one-shot timeout doesn't
  // re-arm), and the customer only learns again from the server's
  // CUTOFF_PASSED. This flag keeps the submit disabled until the selection
  // actually changes (reschedule, or TimeStep's revalidation reseat) — the
  // effect below resets it whenever selectedCutoffMs re-derives.
  const [selectedCutoffPassed, setSelectedCutoffPassed] = useState(false);

  useEffect(() => {
    setSelectedCutoffPassed(false); // fresh selection (or none) → valid again
    // Explicit no-serve guard (belt): TimeStep clears the selection for a
    // no-serve address, which already inerts this watcher — but don't rely on
    // that ordering to keep the wrong modal from firing.
    if (noServe || selectedCutoffMs == null) return;
    const selectedDate = useCheckoutStore.getState().delivery?.date;
    let id: ReturnType<typeof setTimeout> | undefined;
    const fire = () => {
      if (useCheckoutStore.getState().delivery?.date === selectedDate) {
        setShowCutoffModal(true);
        setSelectedCutoffPassed(true);
      }
    };
    // setTimeout overflows (and fires ~immediately) past 2^31−1 ms — clamp and
    // re-arm so a far-future cutoff waits instead of misfiring or going dead.
    const MAX_DELAY_MS = 2 ** 31 - 1;
    const arm = () => {
      const ms = selectedCutoffMs - Date.now();
      if (ms <= 0) {
        fire();
        return;
      }
      id = setTimeout(
        () => {
          if (Date.now() >= selectedCutoffMs) fire();
          else arm();
        },
        Math.min(ms, MAX_DELAY_MS)
      );
    };
    arm();
    return () => clearTimeout(id);
  }, [selectedCutoffMs, noServe]);

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
      <div className="checkout-canvas after-dark-canvas relative flex min-h-screen items-center justify-center">
        <Loader2 className="relative h-8 w-8 animate-spin text-hero-accent" />
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
    <div className="checkout-canvas after-dark-canvas relative min-h-screen pb-32">
      <CheckoutBackdrop />
      <div className="relative mx-auto max-w-4xl px-4 py-6 sm:py-8">
        <CheckoutMasthead step={step} className="mb-6 animate-hero-develop-1" />

        <CheckoutStepperV8
          currentStep={step}
          onStepClick={handleStepClick}
          className="mb-6 animate-hero-develop-2 sm:mb-8"
        />

        {/* Phase 111 CHKP-02 — Price change banner, rendered above step content */}
        {priceChangeError && (
          <div className="mb-6">
            <CheckoutErrorBanner error={priceChangeError} onUpdateCart={handleUpdateCart} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-3">
          {/* Main content - order form with animated transitions */}
          <div className="checkout-sheet-stack lg:col-span-2">
            <div className="hero-surface-glass checkout-paper animate-hero-develop-3 relative overflow-hidden rounded-2xl p-4 sm:p-6">
              {/* Drifting triad top-edge rail */}
              <span
                aria-hidden="true"
                className="checkout-card-rail absolute inset-x-0 top-0 h-[3px]"
              />
              {/* Breathing triad aura behind the form */}
              <span
                aria-hidden="true"
                className="checkout-card-aura pointer-events-none absolute inset-0 rounded-2xl"
              />
              <HeroCardLayers accent="clay" radius="rounded-2xl" />
              <div className="relative">
                <AnimatePresence mode="wait" custom={direction}>
                  {step === "address" && (
                    <m.div key="address" {...stepMotion}>
                      <AddressStep onNext={goToNextStep} deliveryZones={deliveryZones} />
                    </m.div>
                  )}
                  {step === "time" && (
                    <m.div key="time" {...stepMotion}>
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
                    <m.div key="payment" {...stepMotion}>
                      <PaymentStep
                        onBack={goToPrevStep}
                        disableGuard={disableGuard}
                        timeWindows={timeWindows}
                        deliveryDays={deliveryDays}
                        onCutoffPassed={() => setShowCutoffModal(true)}
                        codEnabled={codEnabled}
                        cutoffModalOpen={showCutoffModal || selectedCutoffPassed || !gate.isOpen}
                      />
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Order summary - sticky on desktop */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              {/* Positive-reinforcement rewards nudge above the summary */}
              <CheckoutRewardsCard className="mb-4" />
              {/* Receipt prints itself (thermal-print reveal) — no stacked-paper
                  decoration behind it, so the print read stays self-contained. */}
              <CheckoutSummary />
            </div>
          </div>
        </div>

        {/* Welcome + referral offers below the fold — first-order discount
            auto-applies at payment; "Share & earn" opens a modal (no exit). */}
        <OfferBanner source="checkout" className="mt-8" />
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
