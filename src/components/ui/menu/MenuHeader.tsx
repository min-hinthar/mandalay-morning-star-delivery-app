"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { SearchInput } from "./SearchInput";
import { MenuDietaryFilter } from "./MenuDietaryFilter";
import { hasFreeFromSelected } from "@/lib/menu/dietary-filters";
import { cn } from "@/lib/utils/cn";
import type { MenuItem } from "@/types/menu";

// ============================================
// TYPES
// ============================================

interface MenuHeaderProps {
  /** Callback when search query changes */
  onQueryChange: (query: string) => void;
  /** Callback when menu item is selected from autocomplete */
  onSelectItem?: (item: MenuItem) => void;
  /** All menu items (unfiltered) — powers dietary filter chips + counts */
  items: MenuItem[];
  /** Active dietary filter selections */
  dietaryFilters: string[];
  /** Callback when dietary filters change */
  onDietaryChange: (filters: string[]) => void;
}

// ============================================
// COMPONENT
// ============================================

/**
 * MenuHeader — the editorial MASTHEAD. It is NOT sticky: it scrolls away with
 * the page, leaving the slim CategoryTabs rail (cart moved in there) as the sole
 * pinned bar. Holds the bilingual title, search, and the dietary filter chips.
 */
export function MenuHeader({
  onQueryChange,
  onSelectItem,
  items,
  dietaryFilters,
  onDietaryChange,
}: MenuHeaderProps) {
  // Scroll fade indicators for the horizontally-scrollable dietary chips
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const updateFadeIndicators = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    const isScrollable = scrollWidth > clientWidth;
    setShowLeftFade(isScrollable && scrollLeft > 10);
    setShowRightFade(isScrollable && scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    updateFadeIndicators();
    container.addEventListener("scroll", updateFadeIndicators, { passive: true });

    const resizeObserver = new ResizeObserver(updateFadeIndicators);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", updateFadeIndicators);
      resizeObserver.disconnect();
    };
  }, [updateFadeIndicators]);

  return (
    <header className="px-4 pt-4">
      {/* Top row: editorial title + search — scrolls away (cart lives in the
          pinned rail so it stays reachable after the masthead leaves). */}
      <div className="mx-auto flex max-w-5xl items-end justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <h1 className="font-display text-2xl font-bold leading-none text-text-primary sm:text-3xl">
            Our Menu
          </h1>
          <span className="font-burmese text-sm text-hero-clay/90">မီနူး</span>
        </div>

        <SearchInput
          onQueryChange={onQueryChange}
          onSelectItem={onSelectItem}
          mobileCollapsible={false}
        />
      </div>

      {/* Dietary chips row */}
      <div className="mx-auto mt-3 max-w-5xl">
        <div className="relative w-full">
          {/* Left fade indicator */}
          {showLeftFade && (
            <div
              className={cn(
                "absolute left-0 top-0 bottom-0 w-8 z-10",
                "bg-gradient-to-r from-surface-elevated to-transparent",
                "pointer-events-none"
              )}
              aria-hidden="true"
            />
          )}

          {/* Scroll container */}
          <div ref={scrollContainerRef} className="overflow-x-auto no-scrollbar">
            <MenuDietaryFilter items={items} selected={dietaryFilters} onChange={onDietaryChange} />
          </div>

          {/* Right fade indicator */}
          {showRightFade && (
            <div
              className={cn(
                "absolute right-0 top-0 bottom-0 w-8 z-10",
                "bg-gradient-to-l from-surface-elevated to-transparent",
                "pointer-events-none"
              )}
              aria-hidden="true"
            />
          )}
        </div>

        {/* Allergen-safety disclaimer — shown when a free-from filter is active */}
        {hasFreeFromSelected(dietaryFilters) && (
          <p className="mt-1.5 text-2xs leading-snug text-text-muted">
            Allergen filters reflect the kitchen&rsquo;s declared ingredients — please confirm with
            us for severe allergies.
          </p>
        )}
      </div>
    </header>
  );
}
