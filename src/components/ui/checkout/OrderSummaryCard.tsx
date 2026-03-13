"use client";

import { MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { TimeSlotDisplay } from "./TimeSlotDisplay";
import type { DeliverySelection, TimeWindow } from "@/types/delivery";

interface OrderSummaryCardProps {
  formattedAddress?: string;
  delivery: DeliverySelection | null;
  timeWindows: TimeWindow[];
  className?: string;
}

export function OrderSummaryCard({
  formattedAddress,
  delivery,
  timeWindows,
  className,
}: OrderSummaryCardProps) {
  return (
    <div
      className={cn(
        "space-y-4 rounded-lg bg-surface-secondary p-5 border border-border",
        className
      )}
    >
      {/* Address */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h3 className="font-body text-sm font-medium text-text-muted">Delivery Address</h3>
        </div>
        <p className="font-body text-text-primary text-left">{formattedAddress}</p>
      </div>

      {/* Time */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="font-body text-sm font-medium text-text-muted">Delivery Time</h3>
        </div>
        {delivery && (
          <TimeSlotDisplay
            selection={delivery}
            timeWindows={timeWindows}
            className="mt-1 bg-primary/10 rounded-lg p-3 justify-center"
          />
        )}
      </div>
    </div>
  );
}
