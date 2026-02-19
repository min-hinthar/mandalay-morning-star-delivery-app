"use client";

/**
 * DayOfWeekPills
 * Renders Mon-Sun toggleable pill chips for driver availability scheduling.
 * Adapted from DietaryChipPicker pattern with amber-600 selected state.
 */

import { m } from "framer-motion";
import { useAnimationPreference } from "@/lib/hooks";
import { DAYS_OF_WEEK, DAY_LABELS } from "@/lib/availability";
import type { DayOfWeek } from "@/lib/availability";
import { cn } from "@/lib/utils/cn";

interface DayOfWeekPillsProps {
  selected: DayOfWeek[];
  onChange: (days: DayOfWeek[]) => void;
}

export function DayOfWeekPills({ selected, onChange }: DayOfWeekPillsProps) {
  const { shouldAnimate } = useAnimationPreference();

  const toggle = (day: DayOfWeek) => {
    const next = selected.includes(day)
      ? selected.filter((d) => d !== day)
      : [...selected, day];
    onChange(next);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {DAYS_OF_WEEK.map((day) => {
        const isSelected = selected.includes(day);

        return (
          <m.button
            key={day}
            type="button"
            onClick={() => toggle(day)}
            animate={shouldAnimate ? { scale: isSelected ? [1, 1.15, 1] : 1 } : undefined}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className={cn(
              "inline-flex items-center justify-center px-3 py-1.5 rounded-pill text-sm font-medium",
              "border transition-colors min-h-[44px]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              isSelected
                ? "bg-amber-600 text-text-inverse border-amber-600"
                : "bg-surface-primary text-text-secondary border-border hover:border-primary"
            )}
          >
            {DAY_LABELS[day]}
          </m.button>
        );
      })}
    </div>
  );
}
