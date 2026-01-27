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
 *
 * Phase 9 Plan 01
 */

import { useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { staggerContainer, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useCheckoutStore } from "@/lib/stores/checkout-store";
import { getAvailableDeliveryDates } from "@/lib/utils/delivery-dates";
import { TimeSlotPicker } from "./TimeSlotPicker";
import { Button } from "@/components/ui/button";
import type { DeliverySelection } from "@/types/delivery";

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
}

// ============================================
// MAIN COMPONENT
// ============================================

export function TimeStepV8({ className, onNext, onBack }: TimeStepV8Props) {
  const { shouldAnimate } = useAnimationPreference();
  const { delivery, setDelivery, nextStep: storeNextStep, prevStep: storePrevStep, canProceed } =
    useCheckoutStore();

  const handleNext = onNext || storeNextStep;
  const handleBack = onBack || storePrevStep;

  // Memoize available dates to prevent recalculation on every render
  const availableDates = useMemo(() => getAvailableDeliveryDates(), []);

  const handleSelectionChange = useCallback(
    (selection: DeliverySelection) => {
      setDelivery(selection);
    },
    [setDelivery]
  );

  return (
    <motion.div
      className={cn("space-y-6", className)}
      variants={shouldAnimate ? staggerContainer(0.08, 0.1) : undefined}
      initial={shouldAnimate ? "hidden" : undefined}
      animate={shouldAnimate ? "visible" : undefined}
    >
      {/* Header with stagger */}
      <motion.div variants={shouldAnimate ? staggerItem : undefined}>
        <div className="flex items-center gap-2 mb-1">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold text-foreground">
            Delivery Time
          </h2>
        </div>
        <p className="font-body text-sm text-muted-foreground">
          Choose your preferred delivery window
        </p>
      </motion.div>

      {/* Time slot picker with stagger */}
      <motion.div variants={shouldAnimate ? staggerItem : undefined}>
        <TimeSlotPicker
          availableDates={availableDates}
          selectedDelivery={delivery}
          onSelectionChange={handleSelectionChange}
        />
      </motion.div>

      {/* Navigation with button entry animation */}
      <motion.div
        variants={shouldAnimate ? buttonEntry : undefined}
        className="flex justify-between pt-4 border-t border-border"
      >
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleNext} disabled={!canProceed()} size="lg">
          Continue to Payment
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default TimeStepV8;
