"use client";

import { memo, useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { availableDietaryFilters } from "@/lib/menu/dietary-filters";
import type { MenuItem } from "@/types/menu";

export interface MenuDietaryFilterProps {
  /** All menu items (unfiltered) — used to compute per-filter counts */
  items: MenuItem[];
  /** Selected filter ids */
  selected: string[];
  /** Toggle callback with the next selection */
  onChange: (next: string[]) => void;
  /** Additional className */
  className?: string;
}

/**
 * MenuDietaryFilter — dietary filter chips for the menu.
 *
 * Vocabulary = the menu's own dietary model (allergen-derived "free-from" +
 * explicit tags), NOT the account settings options. Only filters with ≥1
 * matching item are shown (so unpopulated veg/vegan stay hidden until tagged),
 * each with a live count. Selected chips light up gold→clay.
 */
export const MenuDietaryFilter = memo(function MenuDietaryFilter({
  items,
  selected,
  onChange,
  className,
}: MenuDietaryFilterProps) {
  const available = useMemo(() => availableDietaryFilters(items), [items]);

  if (available.length === 0) return null;

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  return (
    <div
      className={cn("flex items-center gap-2", className)}
      role="group"
      aria-label="Dietary filters"
    >
      {available.map(({ def, count }) => {
        const isActive = selected.includes(def.id);
        return (
          <button
            key={def.id}
            type="button"
            onClick={() => toggle(def.id)}
            aria-pressed={isActive}
            className={cn(
              "flex flex-shrink-0 items-center gap-1.5 rounded-pill px-3.5 py-2 min-h-[40px]",
              "text-sm font-semibold whitespace-nowrap",
              "transition-colors focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-primary focus-visible:ring-offset-2",
              isActive
                ? "menu-chip-active text-hero-ink"
                : "border border-border-default bg-surface-secondary text-text-secondary hover:text-text-primary"
            )}
          >
            <span aria-hidden="true">{def.emoji}</span>
            <span>{def.label}</span>
            <span
              className={cn(
                "rounded-full px-1.5 text-2xs tabular-nums",
                isActive ? "bg-hero-ink/15 text-hero-ink" : "bg-surface-tertiary text-text-muted"
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
});

export default MenuDietaryFilter;
