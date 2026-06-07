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

import { useCallback, useEffect, useMemo } from "react";
import { m } from "framer-motion";
import { Clock, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { staggerContainer, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useCheckoutStore, useCanProceed } from "@/lib/stores/checkout-store";
import {
  getAvailableDeliveryDates,
  getAvailableDeliveryDatesMultiDay,
  getZonedDayOfWeek,
} from "@/lib/utils/delivery-dates";
import { CheckoutSectionHeader } from "./CheckoutSectionHeader";
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
    nextStep: storeNextStep,
    prevStep: storePrevStep,
  } = useCheckoutStore();
  const canProceed = useCanProceed();

  const handleNext = onNext || storeNextStep;
  const handleBack = onBack || storePrevStep;

  // Determine customer's delivery directions from address coordinates
  const addressDirections = useMemo(() => {
    if (!address?.lat || !address?.lng || deliveryZones.length === 0) return undefined;
    return getDirectionsForCoords(address.lat, address.lng, deliveryZones);
  }, [address?.lat, address?.lng, deliveryZones]);

  // Filter delivery days by direction when available
  const filteredDays = useMemo(() => {
    if (!addressDirections || addressDirections.length === 0) return deliveryDays;
    return filterDaysByDirection(addressDirections, deliveryDays);
  }, [addressDirections, deliveryDays]);

  // Use multi-day dates when delivery days are configured, legacy otherwise
  const availableDates = useMemo(
    () =>
      filteredDays.length > 0
        ? getAvailableDeliveryDatesMultiDay(new Date(), filteredDays, 6)
        : deliveryDays.length > 0
          ? getAvailableDeliveryDatesMultiDay(new Date(), deliveryDays, 6)
          : getAvailableDeliveryDates(),
    [filteredDays, deliveryDays]
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

  // Auto-select first available delivery date when none selected
  useEffect(() => {
    if (delivery) return; // Already selected, don't override user choice
    const firstAvailable = availableDates.find((d) => !d.cutoffPassed);
    if (firstAvailable && timeWindows.length > 0) {
      setDelivery({
        date: firstAvailable.dateString,
        windowStart: timeWindows[0].start,
        windowEnd: timeWindows[0].end,
      });
    }
  }, [delivery, availableDates, timeWindows, setDelivery]);

  const handleSelectionChange = useCallback(
    (selection: DeliverySelection) => {
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
        <CheckoutSectionHeader
          icon={Clock}
          eyebrow="Delivery Time"
          eyebrowMy="အချိန်"
          lead="When it"
          accent="arrives"
          sub="Choose your preferred delivery window"
        />
        <p className="font-body text-xs text-hero-ink-muted mt-1.5">
          Time windows are preferred delivery times, not guaranteed arrival times.
        </p>
      </m.div>

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
        <Button onClick={handleNext} disabled={!canProceed} size="lg" className="ck-cta">
          Continue to Payment
        </Button>
      </m.div>
    </m.div>
  );
}

export default TimeStepV8;
