"use client";

import { ArrowLeft } from "lucide-react";
import { useCheckoutStore } from "@/lib/stores/checkout-store";
import { useTimeSlot } from "@/lib/hooks/useTimeSlot";
import { TimeSlotPicker } from "./TimeSlotPicker";
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
      <div>
        <h2 className="text-lg font-semibold text-foreground">Delivery Time</h2>
        <p className="text-sm text-muted-foreground">
          Choose your preferred delivery window
        </p>
      </div>

      <TimeSlotPicker
        selectedWindow={selectedWindow}
        onSelect={handleSelectWindow}
      />

      <div className="flex justify-between pt-4 border-t border-border">
        <Button variant="ghost" onClick={prevStep}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={nextStep}
          disabled={!canProceed()}
          className="bg-primary hover:bg-brand-red/90"
        >
          Continue to Payment
        </Button>
      </div>
    </div>
  );
}
