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
        "space-y-4 rounded-xl border border-hero-line bg-hero-clay/[0.05] p-5",
        className
      )}
    >
      {/* Address */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-4 w-4 text-hero-accent" />
          <h3 className="font-body text-xs font-bold uppercase tracking-wider text-hero-accent">
            Delivery Address
          </h3>
        </div>
        <p className="font-body text-hero-ink text-left">{formattedAddress}</p>
      </div>

      {/* Time */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-hero-accent" />
          <h3 className="font-body text-xs font-bold uppercase tracking-wider text-hero-accent">
            Delivery Time
          </h3>
        </div>
        {delivery && (
          <TimeSlotDisplay
            selection={delivery}
            timeWindows={timeWindows}
            className="mt-1 bg-hero-clay/12 rounded-lg p-3 justify-center text-hero-ink"
          />
        )}
      </div>
    </div>
  );
}
