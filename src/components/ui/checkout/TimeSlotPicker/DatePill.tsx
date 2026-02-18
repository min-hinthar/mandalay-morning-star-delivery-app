"use client";

/**
 * DatePill Component
 *
 * Selectable date pill for delivery date picker.
 */

import { m } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import type { DeliveryDate } from "@/types/delivery";
import { TIMEZONE } from "@/types/delivery";

interface DatePillProps {
  date: DeliveryDate;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
  weekOffset: number;
}

export function DatePill({ date, isSelected, onSelect, index, weekOffset }: DatePillProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  const dateObj = date.date;
  const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short", timeZone: TIMEZONE });
  const dayNum = parseInt(
    dateObj.toLocaleDateString("en-US", { day: "numeric", timeZone: TIMEZONE })
  );
  const monthName = dateObj.toLocaleDateString("en-US", { month: "short", timeZone: TIMEZONE });

  const todayStr = new Date().toLocaleDateString("en-US", { timeZone: TIMEZONE });
  const tomorrowDate = new Date(Date.now() + 86400000);
  const tomorrowStr = tomorrowDate.toLocaleDateString("en-US", { timeZone: TIMEZONE });
  const dateStr = dateObj.toLocaleDateString("en-US", { timeZone: TIMEZONE });

  const isToday = todayStr === dateStr;
  const isTomorrow = tomorrowStr === dateStr;

  return (
    <m.button
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
      <span
        className={cn(
          "text-xs font-medium uppercase tracking-wider",
          isSelected ? "text-text-inverse/80" : "text-text-secondary"
        )}
      >
        {isToday ? "Today" : isTomorrow ? "Tomorrow" : dayName}
      </span>

      <m.span
        className="text-2xl font-bold"
        animate={isSelected && shouldAnimate ? { scale: [1, 1.1, 1] } : undefined}
        transition={getSpring(spring.ultraBouncy)}
      >
        {dayNum}
      </m.span>

      <span className={cn("text-xs", isSelected ? "text-text-inverse/80" : "text-text-muted")}>
        {monthName}
      </span>

      {isSelected && (
        <m.div
          initial={shouldAnimate ? { scale: 0 } : undefined}
          animate={shouldAnimate ? { scale: 1 } : undefined}
          transition={getSpring(spring.ultraBouncy)}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-surface-primary flex items-center justify-center"
        >
          <Check className="w-3 h-3 text-primary" />
        </m.div>
      )}

      {weekOffset > 0 && !isSelected && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-2xs px-1.5 py-0.5 rounded-full bg-secondary text-text-primary font-medium whitespace-nowrap">
          {weekOffset === 1 ? "Next Week" : `In ${weekOffset} Weeks`}
        </span>
      )}
    </m.button>
  );
}
