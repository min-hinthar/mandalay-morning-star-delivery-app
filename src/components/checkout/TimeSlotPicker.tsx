"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Calendar, Check, Clock } from "lucide-react";
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
    <div className={cn("space-y-5", className)}>
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Delivery Date</p>
            <p className="text-lg font-bold text-foreground">{deliveryDate.displayDate}</p>
          </div>
        </div>
        {deliveryDate.isNextWeek && (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            Orders for this Saturday have closed. Your order will be delivered
            next Saturday.
          </p>
        )}
      </div>

      {!cutoffInfo.isPastCutoff && cutoffInfo.hours < 24 && (
        <CutoffWarning hours={cutoffInfo.hours} minutes={cutoffInfo.minutes} />
      )}

      <div>
        <h3 className="mb-4 flex items-center gap-3 font-semibold text-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          Select a delivery window
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
          className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <Check className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-emerald-700">Confirmed Delivery</p>
            <p className="font-semibold text-emerald-900">
              {deliveryDate.displayDate}, {selectedWindow.label}
            </p>
          </div>
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
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative rounded-xl border-2 p-4 text-center font-semibold transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isSelected
          ? "border-primary bg-primary/10 text-primary shadow-sm"
          : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-card/80 hover:shadow-sm"
      )}
    >
      <span className="text-sm">{formatShortTime(window.start)}</span>
      <span className="mx-1 text-muted-foreground">–</span>
      <span className="text-sm">{formatShortTime(window.end)}</span>

      {isSelected && (
        <motion.div
          layoutId="selectedSlot"
          className="absolute inset-0 rounded-xl border-2 border-primary"
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
      className="flex items-center gap-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/50 p-4"
    >
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
        <AlertTriangle className="h-6 w-6 text-amber-600" />
      </div>
      <div>
        <p className="font-bold text-amber-900">
          Order soon for this Saturday!
        </p>
        <p className="mt-0.5 text-sm text-amber-800">
          Orders close in <span className="font-semibold">{hours}h {minutes}m</span> (Friday 3:00 PM)
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
