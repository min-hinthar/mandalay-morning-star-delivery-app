"use client";

import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { TIME_WINDOWS, TIMEZONE, type DeliverySelection } from "@/types/delivery";

interface TimeSlotDisplayProps {
  selection: DeliverySelection;
  className?: string;
}

export function TimeSlotDisplay({ selection, className }: TimeSlotDisplayProps) {
  const window = TIME_WINDOWS.find((item) => item.start === selection.windowStart);
  const [year, month, day] = selection.date.split("-").map(Number);
  const displayDate = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: TIMEZONE,
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));

  return (
    <div className={cn("flex flex-wrap items-center gap-4 text-sm", className)}>
      <span className="flex items-center gap-1.5 text-muted">
        <Calendar className="h-4 w-4" />
        {displayDate}
      </span>
      <span className="flex items-center gap-1.5 text-muted">
        <Clock className="h-4 w-4" />
        {window?.label ?? `${selection.windowStart} - ${selection.windowEnd}`}
      </span>
    </div>
  );
}
