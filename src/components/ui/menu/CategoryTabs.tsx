"use client";

/**
 * CategoryTabs Component
 * Horizontal scrolling category tabs with scrollspy behavior
 *
 * Features:
 * - Horizontal scroll on mobile with fade indicators
 * - Active tab highlights based on scroll position via Intersection Observer
 * - Smooth CSS transition pill indicator
 * - Click to scroll to category section
 * - Accessibility: proper tablist/tab roles
 *
 * @example
 * <CategoryTabs
 *   categories={[{ slug: "appetizers", name: "Appetizers" }]}
 *   onCategoryClick={(slug) => console.log(slug)}
 * />
 */

import { memo, useRef, useState, useEffect, useCallback, useMemo } from "react";
import { m } from "framer-motion";
import { useActiveCategory } from "@/lib/hooks/useActiveCategory";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useHeaderVisibility, getHeaderTransition } from "@/lib/hooks/useHeaderVisibility";
import { spring } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils/cn";
import { CartButton } from "@/components/ui/cart";

// Global AppHeader height (h-16). The rail pins directly below it and rides up
// in sync when the header hides on scroll-down (mirrors AppHeader's behavior).
const HEADER_HEIGHT = 64;

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
  /** Additional CSS classes */
  className?: string;
}

export const CategoryTabs = memo(function CategoryTabs({
  categories,
  activeCategory: controlledActiveCategory,
  onCategoryClick,
  className,
}: CategoryTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const { shouldAnimate } = useAnimationPreference();

  // Track the global AppHeader's scroll show/hide so the rail (pinned just below
  // it) rides up to the top edge when the header retracts, and back down when it
  // returns — no overlap, no dead gap. Mirrors AppHeader's own visibility logic.
  const { isVisible: isHeaderVisible, isFastScroll } = useHeaderVisibility();

  // Publish the live rail height so menu sections (scroll-mt) and the scroll-spy
  // clear the pinned rail. As the SOLE pinned bar (the masthead scrolls away),
  // the rail owns --tabs-offset now.
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

  // Determine if we're in controlled mode
  const isControlled = controlledActiveCategory !== undefined;

  // Track previous active category to detect actual changes
  const prevActiveCategoryRef = useRef<string | null>(null);

  // Fade indicator states
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  // CSS indicator position state
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
  } | null>(null);

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

  // Calculate indicator position from active tab button
  const updateIndicatorPosition = useCallback(() => {
    const key = activeCategory ?? "__all__";
    const activeButton = tabRefs.current.get(key);
    if (!activeButton) {
      setIndicatorStyle(null);
      return;
    }
    setIndicatorStyle({
      left: activeButton.offsetLeft,
      width: activeButton.offsetWidth,
    });
  }, [activeCategory]);

  // Set up scroll and resize observers
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Initial check
    updateFadeIndicators();

    // Scroll listener
    container.addEventListener("scroll", updateFadeIndicators, { passive: true });

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      updateFadeIndicators();
      updateIndicatorPosition();
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", updateFadeIndicators);
      resizeObserver.disconnect();
    };
  }, [updateFadeIndicators, updateIndicatorPosition]);

  // Update indicator when active category changes
  useEffect(() => {
    updateIndicatorPosition();
  }, [updateIndicatorPosition]);

  // Scroll active tab into view when category changes
  useEffect(() => {
    // Skip if category hasn't actually changed
    if (activeCategory === prevActiveCategoryRef.current) return;
    prevActiveCategoryRef.current = activeCategory;

    // Use requestAnimationFrame to ensure DOM is updated
    const rafId = requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      // Query DOM directly for selected tab (more reliable than ref with conditional assignment)
      const activeTab = container.querySelector('[aria-selected="true"]') as HTMLElement | null;
      if (!activeTab) return;

      // Calculate the scroll position to center the active tab
      const containerWidth = container.clientWidth;
      const tabOffsetLeft = activeTab.offsetLeft;
      const tabWidth = activeTab.offsetWidth;

      // Calculate target scroll position to center the tab
      const targetScrollLeft = tabOffsetLeft - containerWidth / 2 + tabWidth / 2;

      // Clamp to valid scroll range
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

    return () => {
      cancelAnimationFrame(rafId);
    };
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
    <m.div
      ref={railRef}
      className={cn(
        // The SOLE in-page pinned bar: pins just below the global AppHeader, and
        // rides up to the top edge when that header retracts on scroll (the `y`
        // animation below keeps them flush — no overlap, no gap).
        "sticky z-30",
        // Frosted elevated surface so the rail floats above the photo page
        "menu-bar",
        className
      )}
      style={{ top: "calc(var(--offline-banner-height, 0px) + var(--header-height, 64px))" }}
      animate={{ y: isHeaderVisible ? 0 : -HEADER_HEIGHT }}
      transition={getHeaderTransition(isFastScroll)}
    >
      <div className="flex items-center gap-1 pr-2 sm:pr-3">
        {/* Tabs region (relative anchor for the edge fades) */}
        <div className="relative min-w-0 flex-1">
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
            className={cn("relative flex gap-2 overflow-x-auto scrollbar-hide", "px-4 py-3")}
          >
            {/* CSS-transitioned pill indicator */}
            {indicatorStyle && (
              <div
                className="absolute rounded-pill menu-tab-indicator transition-all duration-200 ease-out"
                style={{
                  left: indicatorStyle.left,
                  width: indicatorStyle.width,
                  top: 12,
                  height: "calc(100% - 24px)",
                }}
                aria-hidden="true"
              />
            )}

            {allTabs.map((tab) => {
              const isActive =
                tab.slug === null ? activeCategory === null : activeCategory === tab.slug;
              const key = tab.slug ?? "__all__";

              return (
                <m.button
                  key={tab.slug ?? "all"}
                  ref={(el) => {
                    if (el) {
                      tabRefs.current.set(key, el);
                    } else {
                      tabRefs.current.delete(key);
                    }
                  }}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={tab.slug ? `category-${tab.slug}` : undefined}
                  onClick={() => handleTabClick(tab.slug)}
                  whileHover={shouldAnimate && !isActive ? { scale: 1.05 } : undefined}
                  whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
                  transition={shouldAnimate ? spring.snappy : { duration: 0 }}
                  className={cn(
                    "relative flex-shrink-0",
                    "rounded-pill px-5 py-2.5 min-h-[44px]",
                    "font-body text-sm",
                    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    isActive
                      ? // Bold warm-white label on the lit magenta→clay pill —
                        // heavier weight + drop shadow reinforce the selected read
                        "menu-tab-active-label font-bold"
                      : // Inactive = legible full-ink/70 medium-weight text, no
                        // chrome, faint chip on hover. Weight + the lit active pill
                        // give clear figure/ground in both themes.
                        "font-medium text-text-primary/70 hover:bg-surface-primary/60 hover:text-text-primary"
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

        {/* Cart — pinned in the rail so it stays reachable after the masthead
            scrolls away (it used to live in the now-scroll-away header). */}
        <CartButton />
      </div>
    </m.div>
  );
});

export default CategoryTabs;
