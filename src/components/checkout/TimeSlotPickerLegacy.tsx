"use client";

/**
 * Legacy TimeSlotPicker for TimeStep compatibility
 * Uses simple time window selection interface
 */

import { motion } from "framer-motion";
import { Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring, staggerContainer, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import type { TimeWindow } from "@/types/delivery";

// Default time windows
const TIME_WINDOWS: TimeWindow[] = [
  { start: "11:00", end: "13:00", label: "11 AM - 1 PM" },
  { start: "13:00", end: "15:00", label: "1 PM - 3 PM" },
  { start: "15:00", end: "17:00", label: "3 PM - 5 PM" },
  { start: "17:00", end: "19:00", label: "5 PM - 7 PM" },
];

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
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <motion.div
      variants={staggerContainer()}
      initial="hidden"
      animate="visible"
      className={cn("space-y-3", className)}
    >
      {TIME_WINDOWS.map((window) => {
        const isSelected =
          selectedWindow?.start === window.start &&
          selectedWindow?.end === window.end;

        return (
          <motion.button
            key={window.start}
            variants={staggerItem}
            onClick={() => onSelect(window)}
            whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
            transition={getSpring(spring.snappy)}
            className={cn(
              "w-full flex items-center justify-between",
              "p-4 rounded-xl border-2 transition-colors",
              isSelected
                ? "border-primary bg-primary-light"
                : "border-border bg-surface-primary hover:border-primary/50"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  isSelected ? "bg-primary text-white" : "bg-surface-secondary text-text-muted"
                )}
              >
                <Clock className="w-5 h-5" />
              </div>
              <span
                className={cn(
                  "font-semibold",
                  isSelected ? "text-primary" : "text-text-primary"
                )}
              >
                {window.label}
              </span>
            </div>
            {isSelected && (
              <motion.div
                initial={shouldAnimate ? { scale: 0 } : undefined}
                animate={shouldAnimate ? { scale: 1 } : undefined}
                transition={getSpring(spring.ultraBouncy)}
                className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
              >
                <Check className="w-4 h-4 text-white" />
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
}

export default TimeSlotPicker;
