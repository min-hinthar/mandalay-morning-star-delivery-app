"use client";

/**
 * CategoryTabs Component
 * Horizontal scrolling category tabs with scrollspy behavior
 *
 * Features:
 * - Horizontal scroll on mobile with fade indicators
 * - Active tab highlights based on scroll position via Intersection Observer
 * - Smooth animated pill indicator with layoutId
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
import { motion } from "framer-motion";
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
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const { shouldAnimate } = useAnimationPreference();

  // Determine if we're in controlled mode
  const isControlled = controlledActiveCategory !== undefined;

  // Fade indicator states
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  // Generate section IDs for scrollspy (only used in uncontrolled mode)
  const sectionIds = useMemo(
    () => categories.map((cat) => `category-${cat.slug}`),
    [categories]
  );

  // Use scrollspy hook (only active in uncontrolled mode)
  const { activeCategory: scrollspyCategory, scrollToCategory } = useActiveCategory(
    isControlled ? [] : sectionIds, // Pass empty array when controlled to disable scrollspy
    {
      rootMargin: "-72px 0px -80% 0px", // Account for sticky header
      headerHeight: 72,
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

    // Initial check
    updateFadeIndicators();

    // Scroll listener
    container.addEventListener("scroll", updateFadeIndicators, { passive: true });

    // Resize observer
    const resizeObserver = new ResizeObserver(updateFadeIndicators);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", updateFadeIndicators);
      resizeObserver.disconnect();
    };
  }, [updateFadeIndicators]);

  // Scroll active tab into view when it changes
  // Using manual scroll calculation instead of scrollIntoView to avoid
  // interaction issues with sticky positioning and simultaneous page scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    const activeTab = activeTabRef.current;

    if (!container || !activeTab) return;

    // Track if effect is still active (component mounted)
    let isMounted = true;
    let rafId: number | null = null;

    // Use requestAnimationFrame to wait for layout to settle after touch events
    // and Framer Motion animations (whileTap scale) on mobile devices.
    // Without this delay, getBoundingClientRect() may return stale values.
    rafId = requestAnimationFrame(() => {
      // Guard against unmount during rAF
      if (!isMounted) return;

      // Re-check refs inside rAF in case component unmounted
      const currentContainer = scrollContainerRef.current;
      const currentTab = activeTabRef.current;

      if (!currentContainer || !currentTab) return;

      // Calculate the scroll position to center the active tab
      const containerRect = currentContainer.getBoundingClientRect();
      const containerWidth = containerRect.width;

      // Use offsetLeft and offsetWidth for more reliable measurements
      // These are not affected by CSS transforms (like whileTap scale)
      const tabOffsetLeft = currentTab.offsetLeft;
      const tabWidth = currentTab.offsetWidth;

      // Calculate target scroll position to center the tab
      const targetScrollLeft = tabOffsetLeft - (containerWidth / 2) + (tabWidth / 2);

      // Clamp to valid scroll range
      const maxScroll = currentContainer.scrollWidth - containerWidth;
      const clampedScrollLeft = Math.max(0, Math.min(targetScrollLeft, maxScroll));

      // Check if tab is already visible using scroll position (not getBoundingClientRect)
      // This is more reliable on mobile as it doesn't depend on viewport coordinates
      const currentScrollLeft = currentContainer.scrollLeft;
      const tabLeftRelativeToScroll = tabOffsetLeft - currentScrollLeft;
      const tabRightRelativeToScroll = tabLeftRelativeToScroll + tabWidth;
      const padding = 20; // pixels of padding to consider "visible"
      const isVisible = tabLeftRelativeToScroll >= padding && tabRightRelativeToScroll <= containerWidth - padding;

      // Only scroll if tab is not visible
      if (!isVisible) {
        const prefersReducedMotion =
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        currentContainer.scrollTo({
          left: clampedScrollLeft,
          behavior: prefersReducedMotion || !shouldAnimate ? "auto" : "smooth",
        });
      }
    });

    return () => {
      isMounted = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
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
    () => [
      { slug: null, name: "All", nameEn: "All", nameMy: undefined },
      ...categories,
    ],
    [categories]
  );

  return (
    <div
      className={cn(
        "sticky top-[var(--tabs-offset)] z-20",
        "bg-surface-primary/80 dark:bg-gray-900/75 backdrop-blur-3xl",
        "border-b border-border-subtle",
        className
      )}
    >
      {/* Left fade indicator */}
      {showLeftFade && (
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-8 z-0",
            "bg-gradient-to-r from-surface-primary/80 to-transparent",
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
        className={cn(
          "flex gap-2 overflow-x-auto scrollbar-hide",
          "px-4 py-3"
        )}
      >
        {allTabs.map((tab) => {
          const isActive =
            tab.slug === null
              ? activeCategory === null
              : activeCategory === tab.slug;

          return (
            <motion.button
              key={tab.slug ?? "all"}
              ref={isActive ? activeTabRef : null}
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
                "font-body text-sm font-semibold",
                "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isActive
                  ? "text-text-inverse"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
              )}
            >
              {/* Animated pill background for active state */}
              {isActive && (
                <motion.span
                  layoutId="activeTabPill"
                  className="absolute inset-0 rounded-pill bg-primary shadow-sm"
                  transition={shouldAnimate ? spring.snappy : { duration: 0 }}
                />
              )}

              {/* Tab label */}
              <span className="relative z-0">
                {tab.nameEn || tab.name}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Right fade indicator */}
      {showRightFade && (
        <div
          className={cn(
            "absolute right-0 top-0 bottom-0 w-8 z-0",
            "bg-gradient-to-l from-surface-primary/80 to-transparent",
            "pointer-events-none"
          )}
          aria-hidden="true"
        />
      )}
    </div>
  );
});

export default CategoryTabs;
