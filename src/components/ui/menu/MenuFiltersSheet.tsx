"use client";

import { Drawer } from "@/components/ui/Drawer";
import { MenuDietaryFilter } from "./MenuDietaryFilter";
import { hasFreeFromSelected } from "@/lib/menu/dietary-filters";
import { cn } from "@/lib/utils/cn";
import type { MenuItem } from "@/types/menu";

export interface MenuFiltersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** All menu items (unfiltered) — powers the chip set + per-filter counts */
  items: MenuItem[];
  /** Active dietary selections */
  selected: string[];
  /** Change handler */
  onChange: (next: string[]) => void;
}

/**
 * MenuFiltersSheet — dietary filters in a textured bottom sheet, opened from the
 * pinned rail's Filters button. Replaces the always-on chip row in the masthead
 * so filtering stays reachable while pinned, without crowding the rail.
 */
export function MenuFiltersSheet({
  isOpen,
  onClose,
  items,
  selected,
  onChange,
}: MenuFiltersSheetProps) {
  const activeCount = selected.length;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} position="bottom" title="Filter the menu">
      <div className="pb-1 pt-1">
        <p className="mb-4 font-burmese text-sm text-hero-clay/90">အစားအစာ စစ်ထုတ်ရန်</p>

        <MenuDietaryFilter
          items={items}
          selected={selected}
          onChange={onChange}
          className="flex-wrap gap-x-3 gap-y-3.5"
        />

        {/* Allergen-safety disclaimer — shown when a free-from filter is active */}
        {hasFreeFromSelected(selected) && (
          <p className="mt-4 text-2xs leading-snug text-text-muted">
            Allergen filters reflect the kitchen&rsquo;s declared ingredients — please confirm with
            us for severe allergies.
          </p>
        )}

        {/* Footer actions */}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-border-default pt-4">
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={activeCount === 0}
            className={cn(
              "rounded-pill px-4 py-2 text-sm font-medium transition-colors",
              "text-text-secondary hover:text-text-primary",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            )}
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "menu-cta-lit text-hero-ink rounded-pill px-6 py-2.5 text-sm font-semibold",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            )}
          >
            {activeCount > 0 ? `Show results (${activeCount})` : "Done"}
          </button>
        </div>
      </div>
    </Drawer>
  );
}

export default MenuFiltersSheet;
