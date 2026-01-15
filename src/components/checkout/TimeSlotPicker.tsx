"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getDeliveryDate, getTimeUntilCutoff } from "@/lib/utils/delivery-dates";
import { TIME_WINDOWS, type TimeWindow } from "@/types/delivery";

interface TimeSlotPickerProps {
  selectedWindow: TimeWindow | null;
  onSelect: (window: TimeWindow) => void;
  className?: string;
}

export function TimeSlotPicker({
  selectedWindow,
  onSelect,
  className,
}: TimeSlotPickerProps) {
  const deliveryDate = useMemo(() => getDeliveryDate(), []);
  const cutoffInfo = useMemo(() => getTimeUntilCutoff(), []);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Calendar className="h-5 w-5 text-brand-red" />
          {deliveryDate.displayDate}
        </div>
        {deliveryDate.isNextWeek && (
          <p className="mt-1 text-sm text-muted">
            Orders for this Saturday have closed. Your order will be delivered
            next Saturday.
          </p>
        )}
      </div>

      {!cutoffInfo.isPastCutoff && cutoffInfo.hours < 24 && (
        <CutoffWarning hours={cutoffInfo.hours} minutes={cutoffInfo.minutes} />
      )}

      <div>
        <h3 className="mb-3 flex items-center gap-2 font-medium text-foreground">
          <Clock className="h-4 w-4 text-muted" />
          Select a delivery window
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TIME_WINDOWS.map((window) => (
            <TimeSlotButton
              key={window.start}
              window={window}
              isSelected={selectedWindow?.start === window.start}
              onSelect={() => onSelect(window)}
            />
          ))}
        </div>
      </div>

      {selectedWindow && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-900"
        >
          <p className="text-sm font-medium">
            Delivery: {deliveryDate.displayDate}, {selectedWindow.label}
          </p>
        </motion.div>
      )}
    </div>
  );
}

interface TimeSlotButtonProps {
  window: TimeWindow;
  isSelected: boolean;
  onSelect: () => void;
}

function TimeSlotButton({
  window,
  isSelected,
  onSelect,
}: TimeSlotButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative rounded-lg border-2 p-3 text-center text-sm font-medium transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2",
        isSelected
          ? "border-brand-red bg-brand-red/10 text-brand-red"
          : "border-border bg-background text-foreground hover:border-brand-red/50"
      )}
    >
      <span>{formatShortTime(window.start)}</span>
      <span className="mx-1 text-muted">-</span>
      <span>{formatShortTime(window.end)}</span>

      {isSelected && (
        <motion.div
          layoutId="selectedSlot"
          className="absolute inset-0 rounded-lg border-2 border-brand-red"
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </motion.button>
  );
}

function CutoffWarning({ hours, minutes }: { hours: number; minutes: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm"
    >
      <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
      <div>
        <p className="font-medium text-amber-900">
          Order soon for this Saturday!
        </p>
        <p className="mt-1 text-amber-800">
          Orders close in {hours}h {minutes}m (Friday 3:00 PM)
        </p>
      </div>
    </motion.div>
  );
}

function formatShortTime(time: string): string {
  const [hours] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour} ${period}`;
}
