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
} from "@/lib/utils/delivery-dates";
import { TimeSlotPicker } from "./TimeSlotPicker";
import { Button } from "@/components/ui/button";
import type { DeliveryDayConfig, DeliverySelection, TimeWindow } from "@/types/delivery";

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
}: TimeStepV8Props) {
  const { shouldAnimate } = useAnimationPreference();
  const {
    delivery,
    setDelivery,
    nextStep: storeNextStep,
    prevStep: storePrevStep,
  } = useCheckoutStore();
  const canProceed = useCanProceed();

  const handleNext = onNext || storeNextStep;
  const handleBack = onBack || storePrevStep;

  // Use multi-day dates when delivery days are configured, legacy otherwise
  const availableDates = useMemo(
    () =>
      deliveryDays.length > 0
        ? getAvailableDeliveryDatesMultiDay(new Date(), deliveryDays, 6)
        : getAvailableDeliveryDates(),
    [deliveryDays]
  );

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
        <div className="flex items-center gap-2 mb-1">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold text-text-primary">Delivery Time</h2>
        </div>
        <p className="font-body text-sm text-text-muted">Choose your preferred delivery window</p>
      </m.div>

      {/* Time slot picker with stagger */}
      <m.div variants={shouldAnimate ? staggerItem : undefined}>
        <TimeSlotPicker
          availableDates={availableDates}
          selectedDelivery={delivery}
          onSelectionChange={handleSelectionChange}
          timeWindows={timeWindows}
        />
      </m.div>

      {/* Navigation with button entry animation */}
      <m.div
        variants={shouldAnimate ? buttonEntry : undefined}
        className="flex justify-between pt-4 border-t border-border"
      >
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleNext} disabled={!canProceed} size="lg">
          Continue to Payment
        </Button>
      </m.div>
    </m.div>
  );
}

export default TimeStepV8;
