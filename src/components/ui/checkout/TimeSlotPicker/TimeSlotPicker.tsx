"use client";

/**
 * TimeSlotPicker Component
 *
 * Main delivery date and time slot selection component.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring, staggerContainer } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import type { TimeWindow, DeliveryDate, DeliverySelection } from "@/types/delivery";
import { TIME_WINDOWS } from "@/types/delivery";
import { DatePill } from "./DatePill";
import { TimeSlotPill } from "./TimeSlotPill";

export interface TimeSlotPickerProps {
  availableDates: DeliveryDate[];
  selectedDelivery: DeliverySelection | null;
  onSelectionChange: (selection: DeliverySelection) => void;
  className?: string;
}

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

  const selectedDate = selectedDelivery?.date || null;
  const selectedTime = selectedDelivery
    ? { start: selectedDelivery.windowStart, end: selectedDelivery.windowEnd }
    : null;

  const weekOffsets = useMemo(() => {
    const firstDateCutoffPassed = availableDates[0]?.cutoffPassed ?? false;
    return availableDates.map((_, index) =>
      firstDateCutoffPassed ? index + 1 : index
    );
  }, [availableDates]);

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

  const scrollBy = useCallback((direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({
      left: direction === "left" ? -200 : 200,
      behavior: "smooth",
    });
  }, []);

  const handleDateSelect = useCallback((date: DeliveryDate) => {
    if (date.cutoffPassed) return;
    if (selectedDelivery && selectedDelivery.date === date.dateString) return;
    onSelectionChange({
      date: date.dateString,
      windowStart: TIME_WINDOWS[0].start,
      windowEnd: TIME_WINDOWS[0].end,
    });
  }, [selectedDelivery, onSelectionChange]);

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
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-text-primary">Select Date</h3>
        </div>

        <div className="relative overflow-y-visible">
          <AnimatePresence>
            {canScrollLeft && (
              <m.button
                type="button"
                initial={shouldAnimate ? { opacity: 0, x: 10 } : undefined}
                animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
                exit={shouldAnimate ? { opacity: 0, x: 10 } : undefined}
                onClick={() => scrollBy("left")}
                className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 z-10",
                  "w-10 h-10 rounded-full",
                  "bg-surface-primary sm:bg-surface-primary/90 sm:backdrop-blur-sm",
                  "border border-border shadow-lg",
                  "flex items-center justify-center",
                  "text-text-primary hover:text-primary transition-colors"
                )}
              >
                <ChevronLeft className="w-5 h-5" />
              </m.button>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {canScrollRight && (
              <m.button
                type="button"
                initial={shouldAnimate ? { opacity: 0, x: -10 } : undefined}
                animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
                exit={shouldAnimate ? { opacity: 0, x: -10 } : undefined}
                onClick={() => scrollBy("right")}
                className={cn(
                  "absolute right-0 top-1/2 -translate-y-1/2 z-10",
                  "w-10 h-10 rounded-full",
                  "bg-surface-primary sm:bg-surface-primary/90 sm:backdrop-blur-sm",
                  "border border-border shadow-lg",
                  "flex items-center justify-center",
                  "text-text-primary hover:text-primary transition-colors"
                )}
              >
                <ChevronRight className="w-5 h-5" />
              </m.button>
            )}
          </AnimatePresence>

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

      <AnimatePresence>
        {selectedDate && (
          <m.div
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

            <m.div
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
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {!selectedDate && (
        <m.p
          initial={shouldAnimate ? { opacity: 0 } : undefined}
          animate={shouldAnimate ? { opacity: 1 } : undefined}
          className="text-center text-text-muted py-4"
        >
          Select a delivery date to see available time slots
        </m.p>
      )}
    </div>
  );
}

export default TimeSlotPicker;
