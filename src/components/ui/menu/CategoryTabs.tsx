"use client";

/**
 * CategoryTabs — horizontal category scroller with scroll-spy.
 *
 * Pure presentational tabs region (NOT the pinned bar): the sticky surface,
 * header-visibility tracking, search, filters and cart live in <MenuRail>, which
 * composes this as its flex-1 center.
 *
 * The active tab is a SELF-CONTAINED `.menu-tab-active` pill (gradient + label on
 * the same element) — no separately-measured indicator div, so the label can
 * never be left on the bare rail (the old "dark-on-dark in dark mode" bug).
 */

import { memo, useRef, useState, useEffect, useCallback, useMemo } from "react";
import { m } from "framer-motion";
import { useActiveCategory } from "@/lib/hooks/useActiveCategory";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { spring } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils/cn";

export interface Category {
  /** URL-friendly slug for the category */
  slug: string;
  /** Display name */
  name: string;
  /** English name (optional) */
  nameEn?: string;
  /** Burmese name (optional) */
  nameMy?: string;
}

export interface CategoryTabsProps {
  /** Array of category objects */
  categories: Category[];
  /**
   * Controlled active category (optional).
   * When provided, disables scrollspy and uses this value instead.
   */
  activeCategory?: string | null;
  /** Optional callback when a category is clicked */
  onCategoryClick?: (slug: string | null) => void;
  /** Additional CSS classes (applied to the tabs region wrapper) */
  className?: string;
}

export const CategoryTabs = memo(function CategoryTabs({
  categories,
  activeCategory: controlledActiveCategory,
  onCategoryClick,
  className,
}: CategoryTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { shouldAnimate } = useAnimationPreference();

  // Determine if we're in controlled mode
  const isControlled = controlledActiveCategory !== undefined;

  // Track previous active category to detect actual changes
  const prevActiveCategoryRef = useRef<string | null>(null);

  // Fade indicator states
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  // Generate section IDs for scrollspy (only used in uncontrolled mode)
  const sectionIds = useMemo(() => categories.map((cat) => `category-${cat.slug}`), [categories]);

  // Use scrollspy hook (only active in uncontrolled mode). The rail is the sole
  // pinned bar (~64px); offline banner offset is added dynamically by the hook.
  const { activeCategory: scrollspyCategory, scrollToCategory } = useActiveCategory(
    isControlled ? [] : sectionIds, // Pass empty array when controlled to disable scrollspy
    {
      rootMargin: "-64px 0px -80% 0px", // Account for the pinned rail
      headerHeight: 64,
    }
  );

  // Resolve active category (controlled takes precedence)
  const activeCategory = isControlled ? controlledActiveCategory : scrollspyCategory;

  // Handle scroll position for fade indicators
  const updateFadeIndicators = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const isScrollable = scrollWidth > clientWidth;

    setShowLeftFade(isScrollable && scrollLeft > 10);
    setShowRightFade(isScrollable && scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  // Set up scroll and resize observers
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

  // Scroll active tab into view when category changes
  useEffect(() => {
    // Skip if category hasn't actually changed
    if (activeCategory === prevActiveCategoryRef.current) return;
    prevActiveCategoryRef.current = activeCategory;

    // Use requestAnimationFrame to ensure DOM is updated
    const rafId = requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      // Query DOM directly for selected tab
      const activeTab = container.querySelector('[aria-selected="true"]') as HTMLElement | null;
      if (!activeTab) return;

      // Center the active tab in the scroller
      const containerWidth = container.clientWidth;
      const targetScrollLeft =
        activeTab.offsetLeft - containerWidth / 2 + activeTab.offsetWidth / 2;
      const maxScroll = container.scrollWidth - containerWidth;
      const clampedScrollLeft = Math.max(0, Math.min(targetScrollLeft, maxScroll));

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      container.scrollTo({
        left: clampedScrollLeft,
        behavior: prefersReducedMotion || !shouldAnimate ? "auto" : "smooth",
      });
    });

    return () => cancelAnimationFrame(rafId);
  }, [activeCategory, shouldAnimate]);

  // Handle tab click
  const handleTabClick = useCallback(
    (slug: string | null) => {
      // Only scroll to category section in uncontrolled (scrollspy) mode
      if (!isControlled) {
        scrollToCategory(slug);
      }
      onCategoryClick?.(slug);
    },
    [isControlled, scrollToCategory, onCategoryClick]
  );

  // All tabs including "All" at the start
  const allTabs = useMemo(
    () => [{ slug: null, name: "All", nameEn: "All", nameMy: undefined }, ...categories],
    [categories]
  );

  return (
    <div className={cn("relative min-w-0", className)}>
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
      <div
        ref={scrollContainerRef}
        role="tablist"
        aria-label="Menu categories"
        className={cn("relative flex gap-2 overflow-x-auto scrollbar-hide", "px-1 py-1")}
      >
        {allTabs.map((tab) => {
          const isActive =
            tab.slug === null ? activeCategory === null : activeCategory === tab.slug;

          return (
            <m.button
              key={tab.slug ?? "all"}
              role="tab"
              aria-selected={isActive}
              aria-controls={tab.slug ? `category-${tab.slug}` : undefined}
              onClick={() => handleTabClick(tab.slug)}
              whileHover={shouldAnimate && !isActive ? { scale: 1.05 } : undefined}
              whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
              transition={shouldAnimate ? spring.snappy : { duration: 0 }}
              className={cn(
                "relative flex-shrink-0 overflow-hidden",
                "rounded-pill px-4 py-2 min-h-[40px]",
                "font-body text-sm font-semibold",
                "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isActive
                  ? // Self-contained lit gold→clay pill (bg + dark-ink label on the
                    // SAME element — never a separate measured indicator to miss)
                    "menu-tab-active font-bold"
                  : // Inactive = layered vellum ghost chip (warm fill + gold
                    // hairline + sheen + dot texture); hover warms to clay
                    "menu-tab-ghost"
              )}
            >
              {/* Tab label */}
              <span className="relative z-0">{tab.nameEn || tab.name}</span>
            </m.button>
          );
        })}
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
  );
});

export default CategoryTabs;
