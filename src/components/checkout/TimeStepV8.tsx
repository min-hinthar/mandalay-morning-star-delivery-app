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
import { variants } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useCheckoutStore } from "@/lib/stores/checkout-store";
import { getAvailableDeliveryDates } from "@/lib/utils/delivery-dates";
import { TimeSlotPicker } from "./TimeSlotPicker";
import { Button } from "@/components/ui/button";
import type { DeliverySelection } from "@/types/delivery";

// ============================================
// TYPES
// ============================================

export interface TimeStepV8Props {
  /** Additional className */
  className?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function TimeStepV8({ className }: TimeStepV8Props) {
  const { shouldAnimate } = useAnimationPreference();
  const { delivery, setDelivery, nextStep, prevStep, canProceed } =
    useCheckoutStore();

  // Memoize available dates to prevent recalculation on every render
  const availableDates = useMemo(() => getAvailableDeliveryDates(), []);

  const handleSelectionChange = useCallback(
    (selection: DeliverySelection) => {
      setDelivery(selection);
    },
    [setDelivery]
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header - V8 colors */}
      <motion.div
        variants={shouldAnimate ? variants.slideUp : undefined}
        initial={shouldAnimate ? "initial" : undefined}
        animate={shouldAnimate ? "animate" : undefined}
      >
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

      {/* Time slot picker */}
      <motion.div
        variants={shouldAnimate ? variants.slideUp : undefined}
        initial={shouldAnimate ? "initial" : undefined}
        animate={shouldAnimate ? "animate" : undefined}
        transition={{ delay: 0.1 }}
      >
        <TimeSlotPicker
          availableDates={availableDates}
          selectedDelivery={delivery}
          onSelectionChange={handleSelectionChange}
        />
      </motion.div>

      {/* Navigation - matches PaymentStepV8 pattern */}
      <motion.div
        variants={shouldAnimate ? variants.slideUp : undefined}
        initial={shouldAnimate ? "initial" : undefined}
        animate={shouldAnimate ? "animate" : undefined}
        transition={{ delay: 0.2 }}
        className="flex justify-between pt-4 border-t border-border"
      >
        <Button variant="ghost" onClick={prevStep}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={nextStep} disabled={!canProceed()} size="lg">
          Continue to Payment
        </Button>
      </motion.div>
    </div>
  );
}

export default TimeStepV8;
