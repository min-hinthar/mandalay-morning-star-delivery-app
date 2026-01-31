"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, ChevronLeft, ChevronRight, Sun, Moon, Sunrise, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring, staggerContainer } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import type { TimeWindow, DeliveryDate, DeliverySelection } from "@/types/delivery";
import { TIME_WINDOWS, TIMEZONE } from "@/types/delivery";

// ============================================
// TYPES
// ============================================

export interface TimeSlotPickerProps {
  /** Available delivery dates */
  availableDates: DeliveryDate[];
  /** Selected delivery */
  selectedDelivery: DeliverySelection | null;
  /** Callback when selection changes */
  onSelectionChange: (selection: DeliverySelection) => void;
  /** Additional className */
  className?: string;
}

// ============================================
// DATE PILL COMPONENT
// ============================================

interface DatePillProps {
  date: DeliveryDate;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
  /** Week offset from current week (0 = this week, 1 = next week, etc.) */
  weekOffset: number;
}

function DatePill({ date, isSelected, onSelect, index, weekOffset }: DatePillProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  // Parse date for display with proper timezone handling
  // Use the actual Date object from DeliveryDate which is already timezone-aware
  const dateObj = date.date;
  const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short", timeZone: TIMEZONE });
  const dayNum = parseInt(dateObj.toLocaleDateString("en-US", { day: "numeric", timeZone: TIMEZONE }));
  const monthName = dateObj.toLocaleDateString("en-US", { month: "short", timeZone: TIMEZONE });

  // Compare dates in the same timezone
  const todayStr = new Date().toLocaleDateString("en-US", { timeZone: TIMEZONE });
  const tomorrowDate = new Date(Date.now() + 86400000);
  const tomorrowStr = tomorrowDate.toLocaleDateString("en-US", { timeZone: TIMEZONE });
  const dateStr = dateObj.toLocaleDateString("en-US", { timeZone: TIMEZONE });

  const isToday = todayStr === dateStr;
  const isTomorrow = tomorrowStr === dateStr;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={date.cutoffPassed}
      initial={shouldAnimate ? { opacity: 0, scale: 0.8, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, scale: 1, y: 0 } : undefined}
      transition={{ ...getSpring(spring.rubbery), delay: index * 0.05 }}
      whileHover={shouldAnimate && !date.cutoffPassed ? { scale: 1.05, y: -4 } : undefined}
      whileTap={shouldAnimate && !date.cutoffPassed ? { scale: 0.95 } : undefined}
      className={cn(
        "relative flex-shrink-0 w-20 py-4 px-2 rounded-2xl",
        "flex flex-col items-center gap-1",
        "border-2 transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "transform-gpu will-change-transform",
        isSelected
          ? "border-primary bg-primary text-text-inverse shadow-lg shadow-primary/30"
          : date.cutoffPassed
          ? "border-border bg-surface-tertiary text-text-muted cursor-not-allowed opacity-50"
          : "border-border bg-surface-primary text-text-primary hover:border-primary/50"
      )}
    >
      {/* Day name or Today/Tomorrow */}
      <span className={cn(
        "text-xs font-medium uppercase tracking-wider",
        isSelected ? "text-text-inverse/80" : "text-text-secondary"
      )}>
        {isToday ? "Today" : isTomorrow ? "Tomorrow" : dayName}
      </span>

      {/* Day number */}
      <motion.span
        className="text-2xl font-bold"
        animate={isSelected && shouldAnimate ? {
          scale: [1, 1.1, 1],
        } : undefined}
        transition={getSpring(spring.ultraBouncy)}
      >
        {dayNum}
      </motion.span>

      {/* Month */}
      <span className={cn(
        "text-xs",
        isSelected ? "text-text-inverse/80" : "text-text-muted"
      )}>
        {monthName}
      </span>

      {/* Selected indicator */}
      {isSelected && (
        <motion.div
          initial={shouldAnimate ? { scale: 0 } : undefined}
          animate={shouldAnimate ? { scale: 1 } : undefined}
          transition={getSpring(spring.ultraBouncy)}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-surface-primary flex items-center justify-center"
        >
          <Check className="w-3 h-3 text-primary" />
        </motion.div>
      )}

      {/* Week offset badge */}
      {weekOffset > 0 && !isSelected && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-2xs px-1.5 py-0.5 rounded-full bg-secondary text-text-primary font-medium whitespace-nowrap">
          {weekOffset === 1 ? "Next Week" : `In ${weekOffset} Weeks`}
        </span>
      )}
    </motion.button>
  );
}

// ============================================
// TIME SLOT PILL COMPONENT
// ============================================

interface TimeSlotPillProps {
  slot: TimeWindow;
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: () => void;
  index: number;
}

function TimeSlotPill({
  slot,
  isSelected,
  isDisabled,
  onSelect,
  index,
}: TimeSlotPillProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  // Determine time of day icon
  const hour = parseInt(slot.start.split(":")[0]);
  const TimeIcon = hour < 12 ? Sunrise : hour < 17 ? Sun : Moon;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={isDisabled}
      initial={shouldAnimate ? { opacity: 0, x: -20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
      transition={{ ...getSpring(spring.snappy), delay: index * 0.04 }}
      whileHover={shouldAnimate && !isDisabled ? { scale: 1.02 } : undefined}
      whileTap={shouldAnimate && !isDisabled ? { scale: 0.98 } : undefined}
      className={cn(
        "relative flex items-center gap-3 px-4 py-3 rounded-xl w-full",
        "border-2 transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "transform-gpu will-change-transform",
        isSelected
          ? "border-primary bg-primary-light/50 shadow-md"
          : isDisabled
          ? "border-border bg-surface-tertiary text-text-muted cursor-not-allowed opacity-50"
          : "border-border bg-surface-primary hover:border-primary/50"
      )}
    >
      {/* Time icon - overflow-hidden prevents scale animation from overflowing */}
      <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
        <motion.div
          animate={isSelected && shouldAnimate ? {
            rotate: [0, -10, 10, 0],
            scale: [1, 1.15, 1],
          } : undefined}
          transition={{
            duration: 0.5,
            delay: 0.1,
          }}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            isSelected
              ? "bg-primary text-text-inverse"
              : "bg-surface-secondary text-text-muted"
          )}
        >
          <TimeIcon className="w-5 h-5" />
        </motion.div>
      </div>

      {/* Time label */}
      <div className="flex-1 text-left">
        <p className={cn(
          "font-semibold",
          isSelected ? "text-primary" : "text-text-primary"
        )}>
          {slot.label}
        </p>
        <p className="text-xs text-text-muted">
          1 hour delivery window
        </p>
      </div>

      {/* Selection indicator */}
      <motion.div
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center",
          isSelected
            ? "border-primary bg-primary"
            : "border-border bg-transparent"
        )}
      >
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={shouldAnimate ? { scale: 0 } : undefined}
              animate={shouldAnimate ? { scale: 1 } : undefined}
              exit={shouldAnimate ? { scale: 0 } : undefined}
              transition={getSpring(spring.ultraBouncy)}
            >
              <Check className="w-4 h-4 text-text-inverse" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.button>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function TimeSlotPicker({
  availableDates,
  selectedDelivery,
  onSelectionChange,
  className,
}: TimeSlotPickerProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Track selected date
  const selectedDate = selectedDelivery?.date || null;
  const selectedTime = selectedDelivery
    ? { start: selectedDelivery.windowStart, end: selectedDelivery.windowEnd }
    : null;

  // Calculate week offsets for badge display
  // If first date's cutoff passed, first valid date is "next week" (offset=1)
  const weekOffsets = useMemo(() => {
    const firstDateCutoffPassed = availableDates[0]?.cutoffPassed ?? false;
    return availableDates.map((_, index) =>
      firstDateCutoffPassed ? index + 1 : index
    );
  }, [availableDates]);

  // Check scroll bounds
  const updateScrollButtons = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  }, []);

  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", updateScrollButtons);
      window.addEventListener("resize", updateScrollButtons);
    }
    return () => {
      container?.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [updateScrollButtons, availableDates]);

  // Scroll handlers
  const scrollBy = useCallback((direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 200;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  }, []);

  // Handle date selection
  const handleDateSelect = useCallback((date: DeliveryDate) => {
    if (date.cutoffPassed) return;

    // If same date, keep time selection; otherwise reset
    if (selectedDelivery && selectedDelivery.date === date.dateString) {
      return;
    }

    // Select date with first available time slot
    onSelectionChange({
      date: date.dateString,
      windowStart: TIME_WINDOWS[0].start,
      windowEnd: TIME_WINDOWS[0].end,
    });
  }, [selectedDelivery, onSelectionChange]);

  // Handle time selection
  const handleTimeSelect = useCallback((slot: TimeWindow) => {
    if (!selectedDate) return;

    onSelectionChange({
      date: selectedDate,
      windowStart: slot.start,
      windowEnd: slot.end,
    });
  }, [selectedDate, onSelectionChange]);

  return (
    <div className={cn("space-y-6 w-full", className)}>
      {/* Date selector */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-text-primary">Select Date</h3>
        </div>

        {/* Scrollable date pills - overflow-visible on y-axis for scale animations */}
        <div className="relative overflow-y-visible">
          {/* Scroll buttons */}
          <AnimatePresence>
            {canScrollLeft && (
              <motion.button
                type="button"
                initial={shouldAnimate ? { opacity: 0, x: 10 } : undefined}
                animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
                exit={shouldAnimate ? { opacity: 0, x: 10 } : undefined}
                onClick={() => scrollBy("left")}
                className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 z-10",
                  "w-10 h-10 rounded-full",
                  // MOBILE CRASH PREVENTION: No backdrop-blur on mobile (causes Safari crashes)
                  "bg-surface-primary sm:bg-surface-primary/90 sm:backdrop-blur-sm",
                  "border border-border shadow-lg",
                  "flex items-center justify-center",
                  "text-text-primary hover:text-primary",
                  "transition-colors"
                )}
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {canScrollRight && (
              <motion.button
                type="button"
                initial={shouldAnimate ? { opacity: 0, x: -10 } : undefined}
                animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
                exit={shouldAnimate ? { opacity: 0, x: -10 } : undefined}
                onClick={() => scrollBy("right")}
                className={cn(
                  "absolute right-0 top-1/2 -translate-y-1/2 z-10",
                  "w-10 h-10 rounded-full",
                  // MOBILE CRASH PREVENTION: No backdrop-blur on mobile (causes Safari crashes)
                  "bg-surface-primary sm:bg-surface-primary/90 sm:backdrop-blur-sm",
                  "border border-border shadow-lg",
                  "flex items-center justify-center",
                  "text-text-primary hover:text-primary",
                  "transition-colors"
                )}
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Date pills container - extra padding for scale animations */}
          <div
            ref={scrollContainerRef}
            className={cn(
              "flex gap-3 overflow-x-auto scrollbar-hide",
              "px-6 py-6 -mx-6",
              "scroll-smooth snap-x snap-mandatory"
            )}
          >
            {availableDates.map((date, index) => (
              <DatePill
                key={date.dateString}
                date={date}
                isSelected={selectedDate === date.dateString}
                onSelect={() => handleDateSelect(date)}
                index={index}
                weekOffset={weekOffsets[index]}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Time slot selector */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={shouldAnimate ? { opacity: 0, height: 0 } : undefined}
            animate={shouldAnimate ? { opacity: 1, height: "auto" } : undefined}
            exit={shouldAnimate ? { opacity: 0, height: 0 } : undefined}
            transition={getSpring(spring.gentle)}
            className="space-y-3 overflow-hidden w-full"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-text-primary">Select Time</h3>
            </div>

            <motion.div
              variants={shouldAnimate ? staggerContainer(0.04, 0.1) : undefined}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 gap-3 px-1 w-full"
            >
              {TIME_WINDOWS.map((slot, index) => {
                const isSlotSelected =
                  selectedTime?.start === slot.start &&
                  selectedTime?.end === slot.end;

                return (
                  <TimeSlotPill
                    key={slot.start}
                    slot={slot}
                    isSelected={isSlotSelected}
                    isDisabled={false}
                    onSelect={() => handleTimeSelect(slot)}
                    index={index}
                  />
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!selectedDate && (
        <motion.p
          initial={shouldAnimate ? { opacity: 0 } : undefined}
          animate={shouldAnimate ? { opacity: 1 } : undefined}
          className="text-center text-text-muted py-4"
        >
          Select a delivery date to see available time slots
        </motion.p>
      )}
    </div>
  );
}

export default TimeSlotPicker;
