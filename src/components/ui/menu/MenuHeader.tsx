"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { CartButton } from "@/components/ui/cart";
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

export function MenuHeader({
  onQueryChange,
  onSelectItem,
  items,
  dietaryFilters,
  onDietaryChange,
}: MenuHeaderProps) {
  // Publish the live header height so CategoryTabs (sticky at --tabs-offset)
  // always sits BELOW the full header — incl. the dietary chips row — so the
  // chips can never hide behind / under the category tabs. The chips stay
  // visible (no scroll-collapse) to keep the header height stable, which avoids
  // the collapse↔expand height race that let the tabs paint over the chips.
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const root = document.documentElement;
    const publish = () => root.style.setProperty("--menu-header-height", `${el.offsetHeight}px`);
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--menu-header-height");
    };
  }, []);

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
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-20",
        // MOBILE CRASH PREVENTION: No backdrop-blur on mobile (causes Safari crashes)
        "bg-[var(--color-cream)] dark:bg-[var(--color-background)] sm:bg-[var(--color-cream)]/95 sm:dark:bg-[var(--color-background)]/95",
        "sm:backdrop-blur-lg border-b border-[var(--color-border)]"
      )}
    >
      {/* Top row: title + search + cart — always visible */}
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <h1 className="font-display text-lg text-brand-red sm:text-xl">Our Menu</h1>

        <div className="flex items-center gap-2">
          <SearchInput
            onQueryChange={onQueryChange}
            onSelectItem={onSelectItem}
            mobileCollapsible={false}
          />
          <CartButton />
        </div>
      </div>

      {/* Dietary chips row: always visible (stable height) */}
      <div className="mx-auto max-w-5xl px-4 pb-2">
        <div className="relative w-full">
          {/* Left fade indicator */}
          {showLeftFade && (
            <div
              className={cn(
                "absolute left-0 top-0 bottom-0 w-8 z-10",
                "bg-gradient-to-r from-[var(--color-cream)] dark:from-[var(--color-background)] to-transparent",
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
                "bg-gradient-to-l from-[var(--color-cream)] dark:from-[var(--color-background)] to-transparent",
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
