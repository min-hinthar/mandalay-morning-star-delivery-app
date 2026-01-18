"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Calendar, Check, Clock, Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getDeliveryDate, getTimeUntilCutoff } from "@/lib/utils/delivery-dates";
import { TIME_WINDOWS, type TimeWindow } from "@/types/delivery";

type SlotStatus = "available" | "popular" | "unavailable";

interface TimeSlotPickerProps {
  selectedWindow: TimeWindow | null;
  onSelect: (window: TimeWindow) => void;
  slotStatus?: Record<string, SlotStatus>;
  className?: string;
}

// Default popular slots (typically 2-3 PM is most popular)
const DEFAULT_POPULAR_SLOTS = ["14:00"];

export function TimeSlotPicker({
  selectedWindow,
  onSelect,
  slotStatus = {},
  className,
}: TimeSlotPickerProps) {
  const deliveryDate = useMemo(() => getDeliveryDate(), []);
  const cutoffInfo = useMemo(() => getTimeUntilCutoff(), []);

  const getSlotStatus = (window: TimeWindow): SlotStatus => {
    if (slotStatus[window.start]) {
      return slotStatus[window.start];
    }
    if (DEFAULT_POPULAR_SLOTS.includes(window.start)) {
      return "popular";
    }
    return "available";
  };

  const allUnavailable = TIME_WINDOWS.every(
    (w) => getSlotStatus(w) === "unavailable"
  );

  return (
    <div className={cn("space-y-5", className)}>
      {/* Delivery Date Card */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-interactive-primary-light)]">
            <Calendar className="h-5 w-5 text-[var(--color-interactive-primary)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">Delivery Date</p>
            <p className="text-lg font-bold text-[var(--color-text-primary)]">
              {deliveryDate.displayDate}
            </p>
          </div>
        </div>
        {deliveryDate.isNextWeek && (
          <p className="mt-3 rounded-lg bg-[var(--color-warning-light)] p-3 text-sm text-[var(--color-warning-dark)]">
            Orders for this Saturday have closed. Your order will be delivered
            next Saturday.
          </p>
        )}
      </div>

      {/* Cutoff Warning */}
      {!cutoffInfo.isPastCutoff && cutoffInfo.hours < 24 && (
        <CutoffWarning hours={cutoffInfo.hours} minutes={cutoffInfo.minutes} />
      )}

      {/* Time Slots Section */}
      <div>
        <h3 className="mb-4 flex items-center gap-3 font-semibold text-[var(--color-text-primary)]">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-muted)]">
            <Clock className="h-4 w-4 text-[var(--color-text-secondary)]" />
          </div>
          Select a delivery window
        </h3>

        {allUnavailable ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-6 text-center">
            <Clock className="h-8 w-8 text-[var(--color-text-secondary)] mx-auto mb-2" />
            <p className="font-semibold text-[var(--color-text-primary)]">
              All slots are full for this date
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Please try a different delivery date.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TIME_WINDOWS.map((window) => {
              const status = getSlotStatus(window);
              return (
                <TimeSlotButton
                  key={window.start}
                  window={window}
                  isSelected={selectedWindow?.start === window.start}
                  isPopular={status === "popular"}
                  isUnavailable={status === "unavailable"}
                  onSelect={() => onSelect(window)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Confirmation */}
      {selectedWindow && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-[var(--color-accent-secondary)]/20 bg-[var(--color-status-success-bg)] p-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent-secondary)]/20">
            <Check className="h-5 w-5 text-[var(--color-accent-secondary)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--color-accent-secondary)]">Confirmed Delivery</p>
            <p className="font-semibold text-[var(--color-accent-secondary-dark)]">
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
  isPopular?: boolean;
  isUnavailable?: boolean;
  onSelect: () => void;
}

function TimeSlotButton({
  window,
  isSelected,
  isPopular = false,
  isUnavailable = false,
  onSelect,
}: TimeSlotButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={isUnavailable ? undefined : onSelect}
      whileHover={isUnavailable ? undefined : { scale: 1.02 }}
      whileTap={isUnavailable ? undefined : { scale: 0.98 }}
      disabled={isUnavailable}
      className={cn(
        "relative rounded-xl border-2 p-4 text-center transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-interactive-primary)] focus-visible:ring-offset-2",
        isUnavailable && [
          "cursor-not-allowed border-[var(--color-border)] bg-[var(--color-surface-muted)]",
          "text-[var(--color-text-secondary)]",
        ],
        !isUnavailable && isSelected && [
          "border-[var(--color-interactive-primary)] bg-[var(--color-interactive-primary-light)]",
          "text-[var(--color-interactive-primary)] shadow-[var(--shadow-glow-gold)]",
        ],
        !isUnavailable && !isSelected && [
          "border-[var(--color-border)] bg-[var(--color-surface)]",
          "text-[var(--color-text-primary)]",
          "hover:border-[var(--color-interactive-primary)]/50 hover:shadow-sm",
        ]
      )}
    >
      {/* Popular badge */}
      {isPopular && !isUnavailable && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            "absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center",
            "rounded-full bg-[var(--color-interactive-primary)] shadow-sm"
          )}
        >
          <Star className="h-3 w-3 fill-white text-white" />
        </motion.div>
      )}

      {/* Time display */}
      <div className={cn(isUnavailable && "line-through")}>
        <span className="text-sm font-semibold">{formatShortTime(window.start)}</span>
        <span className="mx-1 text-[var(--color-text-secondary)]">–</span>
        <span className="text-sm font-semibold">{formatShortTime(window.end)}</span>
      </div>

      {/* Unavailable label */}
      {isUnavailable && (
        <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-secondary)] mt-1">
          Full
        </p>
      )}

      {/* Selected indicator */}
      {isSelected && !isUnavailable && (
        <motion.div
          layoutId="selectedSlot"
          className="absolute inset-0 rounded-xl border-2 border-[var(--color-interactive-primary)]"
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
      className={cn(
        "flex items-center gap-4 rounded-xl p-4",
        "border border-[var(--color-warning)]/20",
        "bg-gradient-to-r from-[var(--color-warning-light)] to-[var(--color-warning-light)]/50"
      )}
    >
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-warning)]/20">
        <AlertTriangle className="h-6 w-6 text-[var(--color-warning-dark)]" />
      </div>
      <div>
        <p className="font-bold text-[var(--color-warning-dark)]">
          Order soon for this Saturday!
        </p>
        <p className="mt-0.5 text-sm text-[var(--color-warning-dark)]/80">
          Orders close in{" "}
          <span className="font-semibold">
            {hours}h {minutes}m
          </span>{" "}
          (Friday 3:00 PM)
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
