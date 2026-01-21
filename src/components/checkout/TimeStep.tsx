/**
 * V6 Time Step - Pepper Aesthetic
 *
 * Checkout step for selecting delivery time window.
 * V6 colors, typography, and micro-interactions.
 */

"use client";

import { ArrowLeft, Clock } from "lucide-react";
import { useCheckoutStore } from "@/lib/stores/checkout-store";
import { useTimeSlot } from "@/lib/hooks/useTimeSlot";
import { TimeSlotPicker } from "./TimeSlotPickerLegacy";
import { Button } from "@/components/ui/button";
import type { TimeWindow } from "@/types/delivery";

export function TimeStep() {
  const { setDelivery, nextStep, prevStep, canProceed } = useCheckoutStore();
  const { selectedWindow, setSelectedWindow, deliveryDate } = useTimeSlot();

  const handleSelectWindow = (window: TimeWindow) => {
    setSelectedWindow(window);
    setDelivery({
      date: deliveryDate.dateString,
      windowStart: window.start,
      windowEnd: window.end,
    });
  };

  return (
    <div className="space-y-6">
      {/* V6 Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Delivery Time
          </h2>
        </div>
        <p className="font-body text-sm text-text-secondary">
          Choose your preferred delivery window
        </p>
      </div>

      <TimeSlotPicker
        selectedWindow={selectedWindow}
        onSelect={handleSelectWindow}
      />

      {/* V6 Navigation */}
      <div className="flex justify-between pt-4 border-t border-border">
        <Button variant="ghost" onClick={prevStep}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          variant="primary"
          onClick={nextStep}
          disabled={!canProceed()}
          size="lg"
        >
          Continue to Payment
        </Button>
      </div>
    </div>
  );
}
