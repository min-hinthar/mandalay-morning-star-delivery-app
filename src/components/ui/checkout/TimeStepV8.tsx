"use client";

/**
 * TimeStepV8 - V8 time step component with enhanced animations
 *
 * Features:
 * - V8 color tokens (text-foreground, text-muted-foreground)
 * - Motion tokens from @/lib/motion-tokens
 * - Animation preference support via useAnimationPreference hook
 * - Enhanced TimeSlotPicker (not Legacy)
 * - Smooth step transitions
 * - Multi-day delivery support
 *
 * Phase 9 Plan 01
 */

/**
 * Phase 111 CHKP-01 D-06 — TimeStepV8 was inspected for react-hook-form
 * usage during plan-phase revision. FINDING: no RHF hook, no controlled
 * text inputs, no inline validation surface. D-06 "wire to RHF for
 * consistency" only applies to forms with text inputs that need inline
 * validation as the user types. TimeSlotPicker is a button-selection UI;
 * canProceed (Zustand selector) gates the Continue button. No changes
 * needed in this file for Phase 111.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { m } from "framer-motion";
import { Clock, ArrowLeft, CalendarX2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { staggerContainer, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useCheckoutStore, useCanProceed } from "@/lib/stores/checkout-store";
import {
  getAvailableDeliveryDates,
  getAvailableDeliveryDatesMultiDay,
  getZonedDayOfWeek,
  CUTOFF_SAFETY_BUFFER_MS,
} from "@/lib/utils/delivery-dates";
import { CheckoutSectionHeader } from "./CheckoutSectionHeader";
import { CtaMagnet } from "./CtaMagnet";
import { SelectedCutoffChip, resolveSelectedCutoff } from "./SelectedCutoffChip";
import { TimeSlotPicker } from "./TimeSlotPicker";
import { DeliveryZoneInfoCard } from "./DeliveryZoneInfoCard";
import { Button } from "@/components/ui/button";
import type {
  DeliveryDayConfig,
  DeliveryDirection,
  DeliverySelection,
  DeliveryZoneConfig,
  TimeWindow,
} from "@/types/delivery";
import { getDirectionsForCoords, filterDaysByDirection } from "@/lib/utils/delivery-zones";

/** Why the step silently changed the selected date — drives the notice copy. */
type MoveReason = "route" | "cutoff";

/** Button entry animation variant */
const buttonEntry = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 500, damping: 30, mass: 0.8 },
  },
};

// ============================================
// TYPES
// ============================================

export interface TimeStepV8Props {
  /** Additional className */
  className?: string;
  /** Custom next step handler */
  onNext?: () => void;
  /** Custom back step handler */
  onBack?: () => void;
  /** Dynamic time windows generated from configured delivery hours */
  timeWindows?: TimeWindow[];
  /** Multi-day delivery configs; uses legacy Saturday-only when empty */
  deliveryDays?: DeliveryDayConfig[];
  /** Delivery zone configs for direction filtering */
  deliveryZones?: DeliveryZoneConfig[];
}

// ============================================
// MAIN COMPONENT
// ============================================

export function TimeStepV8({
  className,
  onNext,
  onBack,
  timeWindows = [],
  deliveryDays = [],
  deliveryZones = [],
}: TimeStepV8Props) {
  const { shouldAnimate } = useAnimationPreference();
  const {
    address,
    delivery,
    setDelivery,
    clearDelivery,
    nextStep: storeNextStep,
    prevStep: storePrevStep,
  } = useCheckoutStore();
  const canProceed = useCanProceed();

  const handleNext = onNext || storeNextStep;
  const handleBack = onBack || storePrevStep;

  // Minute tick so availableDates (and each pill's cutoffPassed) re-derive as
  // time passes — the memo below is otherwise frozen at mount, letting a pill
  // read "orderable" long after its cutoff crossed mid-session.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // A silent date change is worse than no change — when the effect below has
  // to move the selection, say so (aria-live, bilingual) instead of leaving a
  // differently-highlighted pill as the only clue. The ref remembers WHICH
  // address triggered the move: a LATER address change that revalidates
  // without moving clears the now-stale notice, while the re-run right after
  // the reseat (same address) keeps it visible.
  const [moveNotice, setMoveNotice] = useState<{ toDisplay: string; reason: MoveReason } | null>(
    null
  );
  const noticeAddressRef = useRef<string | undefined>(undefined);

  // Determine customer's delivery directions from address coordinates
  const addressDirections = useMemo(() => {
    if (!address?.lat || !address?.lng || deliveryZones.length === 0) return undefined;
    return getDirectionsForCoords(address.lat, address.lng, deliveryZones);
  }, [address?.lat, address?.lng, deliveryZones]);

  // ACTIVE days only — filterDaysByDirection doesn't know about isActive, and
  // an inactive row that "serves" the address would defeat the no-serve
  // predicate below while the date engine (which does drop inactive rows)
  // renders zero pills: an empty picker with no explanation.
  const activeDays = useMemo(() => deliveryDays.filter((d) => d.isActive), [deliveryDays]);

  // Filter delivery days by direction when available.
  //
  // `undefined` = no placeable address yet, so offer everything. An EMPTY array
  // is a placed, NEARBY address — which now keeps every day through
  // filterDaysByDirection rather than bypassing the filter. Bypassing it used
  // to also keep days with NO configured direction, which checkout rejects:
  // the customer picked one and got a direction-mismatch error at submit.
  const filteredDays = useMemo(() => {
    if (!addressDirections) return activeDays;
    return filterDaysByDirection(addressDirections, activeDays);
  }, [addressDirections, activeDays]);

  // A placed address whose direction filter leaves NOTHING is a real answer,
  // not a gap to paper over: the old fallback re-offered the UNFILTERED list
  // here, so the exact customer no run serves picked a day and got a
  // direction-mismatch rejection at Place Order. Now it renders an honest
  // empty state instead (below). `undefined` directions (no placeable address
  // yet) still offer everything; `[]` is nearby and keeps every day via
  // filterDaysByDirection. Requires at least one ACTIVE day: with none, the
  // right story is the legacy schedule (no multi-day config at all) or the
  // ordering-closed gate (all runs off) — "no runs serve your address" would
  // be false personalization of a global state.
  const noServe =
    activeDays.length > 0 && addressDirections !== undefined && filteredDays.length === 0;

  // Use multi-day dates when delivery days are configured, legacy otherwise
  const availableDates = useMemo(
    () =>
      noServe
        ? []
        : filteredDays.length > 0
          ? getAvailableDeliveryDatesMultiDay(new Date(nowTick), filteredDays, 6)
          : deliveryDays.length > 0
            ? getAvailableDeliveryDatesMultiDay(new Date(nowTick), deliveryDays, 6)
            : getAvailableDeliveryDates(new Date(nowTick)),
    [noServe, filteredDays, deliveryDays, nowTick]
  );

  // Build direction lookup for date pills
  const dateDirectionMap = useMemo(() => {
    const map = new Map<string, DeliveryDirection>();
    for (const date of availableDates) {
      const dayOfWeek = getZonedDayOfWeek(date.date);
      const dayConfig = filteredDays.find((d) => d.dayOfWeek === dayOfWeek);
      if (dayConfig) {
        map.set(date.dateString, dayConfig.direction ?? "all");
      }
    }
    return map;
  }, [availableDates, filteredDays]);

  // Ensure a VALID selection, not just any selection. Beyond the original
  // auto-select this also revalidates an existing choice, because a stored
  // date can go stale two ways mid-checkout: the customer goes back and swaps
  // to an address whose route doesn't serve that day, or the date's own cutoff
  // passes (incl. a sessionStorage rehydration from an earlier visit). The old
  // effect early-returned on `delivery` and the stale date rode through
  // Continue to a guaranteed server rejection at Place Order.
  useEffect(() => {
    if (noServe) {
      if (delivery) clearDelivery();
      return;
    }
    const firstAvailable = availableDates.find((d) => !d.cutoffPassed);

    if (!delivery) {
      if (firstAvailable && timeWindows.length > 0) {
        setDelivery({
          date: firstAvailable.dateString,
          windowStart: timeWindows[0].start,
          windowEnd: timeWindows[0].end,
        });
      }
      return;
    }

    const current = availableDates.find((d) => d.dateString === delivery.date);
    if (current && !current.cutoffPassed) {
      // Still valid — never override. A DIFFERENT address than the one that
      // caused the move also serving this date means the notice is stale.
      if (noticeAddressRef.current !== address?.id) setMoveNotice(null);
      return;
    }

    if (firstAvailable) {
      // Keep the chosen window when it still exists; windows are global.
      const windowValid = timeWindows.some(
        (w) => w.start === delivery.windowStart && w.end === delivery.windowEnd
      );
      const fallbackWindow = timeWindows[0];
      if (!windowValid && !fallbackWindow) return;
      // The multi-day date list PRE-FILTERS passed dates, so a cutoff-crossed
      // selection is simply absent (never flagged cutoffPassed) — derive the
      // reason from the date's own cutoff instant instead.
      const cutoff = resolveSelectedCutoff(delivery.date, deliveryDays);
      const cutoffCrossed =
        cutoff != null && cutoff.getTime() - CUTOFF_SAFETY_BUFFER_MS <= Date.now();
      setDelivery({
        date: firstAvailable.dateString,
        windowStart: windowValid ? delivery.windowStart : fallbackWindow.start,
        windowEnd: windowValid ? delivery.windowEnd : fallbackWindow.end,
      });
      noticeAddressRef.current = address?.id;
      setMoveNotice({
        toDisplay: firstAvailable.displayDate,
        reason: cutoffCrossed ? "cutoff" : "route",
      });
    } else {
      clearDelivery();
    }
  }, [
    noServe,
    delivery,
    availableDates,
    timeWindows,
    deliveryDays,
    address?.id,
    setDelivery,
    clearDelivery,
  ]);

  const handleSelectionChange = useCallback(
    (selection: DeliverySelection) => {
      setMoveNotice(null); // a deliberate pick supersedes the auto-move notice
      setDelivery(selection);
    },
    [setDelivery]
  );

  return (
    <m.div
      className={cn("space-y-6", className)}
      variants={shouldAnimate ? staggerContainer(0.08, 0.1) : undefined}
      initial={shouldAnimate ? "hidden" : undefined}
      animate={shouldAnimate ? "visible" : undefined}
    >
      {/* Header with stagger */}
      <m.div variants={shouldAnimate ? staggerItem : undefined}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CheckoutSectionHeader
            icon={Clock}
            eyebrow="Delivery Time"
            eyebrowMy="အချိန်"
            lead="When it"
            accent="arrives"
            sub="Choose your preferred delivery window"
          />
          {/* Live deadline for the SELECTED date — the one countdown that
              matters once a day is chosen */}
          {!noServe && delivery?.date && (
            <SelectedCutoffChip
              dateString={delivery.date}
              deliveryDays={deliveryDays}
              className="mt-1"
            />
          )}
        </div>
        <p className="font-body text-xs text-hero-ink-muted mt-1.5">
          Time windows are preferred delivery times, not guaranteed arrival times.
        </p>
      </m.div>

      {/* Auto-move notice — the effect above changed the date; say so out loud */}
      {!noServe && moveNotice && (
        <div
          role="status"
          className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3"
        >
          <p className="font-body text-sm font-medium text-hero-ink">
            {moveNotice.reason === "cutoff"
              ? `That date's ordering cutoff passed — we moved your delivery to ${moveNotice.toDisplay}.`
              : `Your address's route runs on different days — we moved your delivery to ${moveNotice.toDisplay}.`}
          </p>
          <p className="font-burmese text-xs text-hero-ink-muted mt-0.5" lang="my">
            သင့်ပို့ဆောင်မှုရက်ကို {moveNotice.toDisplay} သို့ ပြောင်းထားပါသည်။
          </p>
        </div>
      )}

      {noServe ? (
        /* Honest empty state — no run serves this address; never re-offer the
           unfiltered day list the server would reject. */
        <m.div
          variants={shouldAnimate ? staggerItem : undefined}
          role="status"
          className="hero-surface-paper relative rounded-2xl border border-hero-line p-6 text-center"
        >
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-hero-clay/10">
            <CalendarX2 className="h-6 w-6 text-hero-accent" aria-hidden="true" />
          </span>
          <h3 className="font-display mt-3 text-lg font-semibold text-hero-ink">
            No upcoming runs serve your address
          </h3>
          <p className="font-burmese text-sm text-hero-ink-muted" lang="my">
            သင့်လိပ်စာသို့ လက်ရှိပို့ဆောင်မှုလမ်းကြောင်း မရှိသေးပါ
          </p>
          <p className="font-body mx-auto mt-2 max-w-md text-sm text-hero-ink-muted">
            Each delivery day drives a set route, and none currently pass your way. Try a different
            address, or check back soon — routes grow with our kitchen.
          </p>
          <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={handleBack}
              className="min-h-11 border-hero-line text-hero-ink hover:border-hero-clay/60 hover:bg-hero-clay/10"
            >
              <MapPin className="mr-2 h-4 w-4" aria-hidden="true" />
              Use a different address
            </Button>
          </div>
        </m.div>
      ) : (
        <>
          {/* Delivery zone info card */}
          {address?.lat && address?.lng && deliveryZones.length > 0 && (
            <m.div variants={shouldAnimate ? staggerItem : undefined}>
              <DeliveryZoneInfoCard
                address={address}
                deliveryZones={deliveryZones}
                deliveryDays={filteredDays.length > 0 ? filteredDays : deliveryDays}
              />
            </m.div>
          )}

          {/* Time slot picker with stagger */}
          <m.div variants={shouldAnimate ? staggerItem : undefined}>
            <TimeSlotPicker
              availableDates={availableDates}
              selectedDelivery={delivery}
              onSelectionChange={handleSelectionChange}
              timeWindows={timeWindows}
              dateDirectionMap={dateDirectionMap}
            />
          </m.div>
        </>
      )}

      {/* Navigation with button entry animation */}
      <m.div
        variants={shouldAnimate ? buttonEntry : undefined}
        className="flex justify-between pt-4 border-t border-hero-line"
      >
        <Button
          variant="ghost"
          onClick={handleBack}
          className="border border-hero-line bg-hero-card text-hero-ink hover:border-hero-clay/60 hover:bg-hero-clay/10 hover:text-hero-accent"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <CtaMagnet>
          <Button onClick={handleNext} disabled={!canProceed} size="lg" className="ck-cta">
            Continue to Payment
          </Button>
        </CtaMagnet>
      </m.div>
    </m.div>
  );
}

export default TimeStepV8;
