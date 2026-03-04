"use client";

import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
// TIMEZONE is imported from types/delivery (env-var-backed). In client components,
// Next.js inlines the constant at build time, so the fallback value gets baked in.
// This is acceptable — client formatting is display-only.
import { TIMEZONE, type DeliverySelection, type TimeWindow } from "@/types/delivery";

interface TimeSlotDisplayProps {
  selection: DeliverySelection;
  timeWindows: TimeWindow[];
  className?: string;
}

export function TimeSlotDisplay({ selection, timeWindows, className }: TimeSlotDisplayProps) {
  const window = timeWindows.find((item) => item.start === selection.windowStart);
  const [year, month, day] = selection.date.split("-").map(Number);
  const displayDate = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: TIMEZONE,
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));

  return (
    <div className={cn("flex flex-wrap items-center gap-4 text-sm", className)}>
      <span className="flex items-center gap-1.5 text-text-primary">
        <Calendar className="h-4 w-4 text-primary" />
        {displayDate}
      </span>
      <span className="flex items-center gap-1.5 text-text-primary">
        <Clock className="h-4 w-4 text-primary" />
        {window?.label ?? `${selection.windowStart} - ${selection.windowEnd}`}
      </span>
    </div>
  );
}
