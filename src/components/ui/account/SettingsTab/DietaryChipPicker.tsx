"use client";

/**
 * DietaryChipPicker
 * Renders predefined dietary restriction options as toggleable chips.
 * Each chip shows emoji + label + checkmark with pop animation on selection.
 */

import { m } from "framer-motion";
import { Check } from "lucide-react";
import { useAnimationPreference } from "@/lib/hooks";
import { DIETARY_OPTIONS, DIETARY_EMOJIS } from "./settings-types";
import type { DietaryOption } from "./settings-types";
import { cn } from "@/lib/utils/cn";

interface DietaryChipPickerProps {
  selected: string[];
  onChange: (items: string[]) => void;
}

export function DietaryChipPicker({ selected, onChange }: DietaryChipPickerProps) {
  const { shouldAnimate } = useAnimationPreference();

  const toggle = (option: DietaryOption) => {
    const next = selected.includes(option)
      ? selected.filter((o) => o !== option)
      : [...selected, option];
    onChange(next);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {DIETARY_OPTIONS.map((option) => {
        const isSelected = selected.includes(option);
        const emoji = DIETARY_EMOJIS[option];

        return (
          <m.button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            animate={shouldAnimate ? { scale: isSelected ? [1, 1.15, 1] : 1 } : undefined}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-sm font-medium",
              "border transition-colors min-h-[44px] sm:min-h-0",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              isSelected
                ? "bg-amber-600 text-text-inverse border-amber-600"
                : "bg-surface-primary text-text-secondary border-border hover:border-primary"
            )}
          >
            <span className="text-base" role="img" aria-hidden="true">
              {emoji}
            </span>
            <span>{option}</span>
            {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
          </m.button>
        );
      })}
    </div>
  );
}
