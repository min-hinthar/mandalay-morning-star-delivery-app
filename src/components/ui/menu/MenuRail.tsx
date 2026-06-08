"use client";

import { useRef, useState, useEffect } from "react";
import { m } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import { useHeaderVisibility, getHeaderTransition } from "@/lib/hooks/useHeaderVisibility";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { cn } from "@/lib/utils/cn";
import { SearchInput } from "./SearchInput";
import { CategoryTabs, type Category } from "./CategoryTabs";
import { RailCutoffChip } from "./RailCutoffChip";
import { MenuFiltersSheet } from "./MenuFiltersSheet";
import type { MenuItem } from "@/types/menu";
import type { DeliveryDayConfig } from "@/types/delivery";

// Global AppHeader height (h-16). The rail pins directly below it and rides up
// in sync when the header hides on scroll-down (mirrors AppHeader's behavior).
const HEADER_HEIGHT = 64;

export interface MenuRailProps {
  categories: Category[];
  /** All menu items (unfiltered) — search autocomplete + filter counts */
  items: MenuItem[];
  onQueryChange: (query: string) => void;
  onSelectItem?: (item: MenuItem) => void;
  dietaryFilters: string[];
  onDietaryChange: (filters: string[]) => void;
  /** @deprecated Use deliveryDays instead */
  cutoffDay?: number;
  /** @deprecated Use deliveryDays instead */
  cutoffHour?: number;
  deliveryDays?: DeliveryDayConfig[];
}

/**
 * MenuRail — the single pinned toolbar that replaces the old stacked
 * header+tabs+banners chrome. Composes (L→R): an expand-on-tap search (on-page
 * live filter), the scroll-spy category tabs, a live cutoff chip, and a Filters
 * button that opens the dietary bottom sheet. Cart + ⌘K search are intentionally
 * NOT here — the global AppHeader owns those (no more two-carts/two-searches).
 *
 * Pins just below the global AppHeader and slides in sync with its scroll
 * show/hide. Publishes its measured height as --menu-rail-height for section
 * scroll-margins + the scroll-spy.
 */
export function MenuRail({
  categories,
  items,
  onQueryChange,
  onSelectItem,
  dietaryFilters,
  onDietaryChange,
  cutoffDay,
  cutoffHour,
  deliveryDays,
}: MenuRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const { shouldAnimate } = useAnimationPreference();
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Track the global AppHeader's scroll show/hide so the rail (pinned just below
  // it) rides up to the top edge when the header retracts, and back down when it
  // returns — no overlap, no dead gap.
  const { isVisible: isHeaderVisible, isFastScroll } = useHeaderVisibility();

  // Publish the live rail height so menu sections (scroll-mt) + the scroll-spy
  // clear the pinned rail.
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const root = document.documentElement;
    const publish = () => root.style.setProperty("--menu-rail-height", `${el.offsetHeight}px`);
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--menu-rail-height");
    };
  }, []);

  const activeFilterCount = dietaryFilters.length;

  return (
    <m.div
      ref={railRef}
      className={cn("menu-bar sticky z-30")}
      style={{ top: "calc(var(--offline-banner-height, 0px) + var(--header-height, 64px))" }}
      animate={{ y: isHeaderVisible ? 0 : -HEADER_HEIGHT }}
      transition={getHeaderTransition(isFastScroll)}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-1.5 px-3 py-2 sm:gap-2.5">
        {/* Expand-on-tap search — the on-page live filter (global ⌘K is separate) */}
        <SearchInput
          onQueryChange={onQueryChange}
          onSelectItem={onSelectItem}
          mobileCollapsible
          placeholder="Search dishes…"
          className="shrink-0 sm:w-52"
        />

        {/* Category tabs — the flex-1 center */}
        <CategoryTabs categories={categories} className="flex-1" />

        {/* Live cutoff chip (condensed; full countdown is in the masthead) */}
        <RailCutoffChip cutoffDay={cutoffDay} cutoffHour={cutoffHour} deliveryDays={deliveryDays} />

        {/* Filters → bottom sheet */}
        <m.button
          type="button"
          onClick={() => setFiltersOpen(true)}
          whileTap={shouldAnimate ? { scale: 0.92 } : undefined}
          className={cn(
            "menu-rail-filter-btn relative flex shrink-0 items-center gap-1.5 rounded-pill",
            "min-h-[40px] px-3 py-2 text-sm font-semibold",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            activeFilterCount > 0
              ? "menu-rail-filter-btn-active text-hero-ink"
              : "text-text-primary"
          )}
          aria-label={
            activeFilterCount > 0 ? `Filters, ${activeFilterCount} active` : "Filter the menu"
          }
          aria-haspopup="dialog"
          aria-expanded={filtersOpen}
        >
          <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span
              className="menu-rail-filter-badge grid h-5 min-w-[20px] place-items-center rounded-full px-1 text-2xs font-bold tabular-nums"
              aria-hidden="true"
            >
              {activeFilterCount}
            </span>
          )}
        </m.button>
      </div>

      <MenuFiltersSheet
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        items={items}
        selected={dietaryFilters}
        onChange={onDietaryChange}
      />
    </m.div>
  );
}

export default MenuRail;
