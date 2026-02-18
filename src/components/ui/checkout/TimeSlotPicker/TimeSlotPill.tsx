"use client";

/**
 * TimeSlotPill Component
 *
 * Selectable time slot button with time-of-day icon.
 */

import { m, AnimatePresence } from "framer-motion";
import { Sun, Moon, Sunrise, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import type { TimeWindow } from "@/types/delivery";

interface TimeSlotPillProps {
  slot: TimeWindow;
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: () => void;
  index: number;
}

export function TimeSlotPill({ slot, isSelected, isDisabled, onSelect, index }: TimeSlotPillProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  const hour = parseInt(slot.start.split(":")[0]);
  const TimeIcon = hour < 12 ? Sunrise : hour < 17 ? Sun : Moon;

  return (
    <m.button
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
      <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
        <m.div
          animate={
            isSelected && shouldAnimate
              ? {
                  rotate: [0, -10, 10, 0],
                  scale: [1, 1.15, 1],
                }
              : undefined
          }
          transition={{ duration: 0.5, delay: 0.1 }}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            isSelected ? "bg-primary text-text-inverse" : "bg-surface-secondary text-text-muted"
          )}
        >
          <TimeIcon className="w-5 h-5" />
        </m.div>
      </div>

      <div className="flex-1 text-left">
        <p className={cn("font-semibold", isSelected ? "text-primary" : "text-text-primary")}>
          {slot.label}
        </p>
        <p className="text-xs text-text-muted">1 hour delivery window</p>
      </div>

      <m.div
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center",
          isSelected ? "border-primary bg-primary" : "border-border bg-transparent"
        )}
      >
        <AnimatePresence>
          {isSelected && (
            <m.div
              initial={shouldAnimate ? { scale: 0 } : undefined}
              animate={shouldAnimate ? { scale: 1 } : undefined}
              exit={shouldAnimate ? { scale: 0 } : undefined}
              transition={getSpring(spring.ultraBouncy)}
            >
              <Check className="w-4 h-4 text-text-inverse" />
            </m.div>
          )}
        </AnimatePresence>
      </m.div>
    </m.button>
  );
}
