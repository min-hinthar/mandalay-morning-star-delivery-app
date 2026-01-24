"use client";

/**
 * CategoryTabsV8 Component
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
 * <CategoryTabsV8
 *   categories={[{ slug: "appetizers", name: "Appetizers" }]}
 *   onCategoryClick={(slug) => console.log(slug)}
 * />
 */

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
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

export interface CategoryTabsV8Props {
  /** Array of category objects */
  categories: Category[];
  /** Optional callback when a category is clicked */
  onCategoryClick?: (slug: string | null) => void;
  /** Additional CSS classes */
  className?: string;
}

export function CategoryTabsV8({
  categories,
  onCategoryClick,
  className,
}: CategoryTabsV8Props) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const { shouldAnimate } = useAnimationPreference();

  // Fade indicator states
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  // Generate section IDs for scrollspy
  const sectionIds = useMemo(
    () => categories.map((cat) => `category-${cat.slug}`),
    [categories]
  );

  // Use scrollspy hook
  const { activeCategory, scrollToCategory } = useActiveCategory(sectionIds, {
    rootMargin: "-72px 0px -80% 0px", // Account for sticky header
    headerHeight: 72,
  });

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
  useEffect(() => {
    if (!activeTabRef.current || !shouldAnimate) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    activeTabRef.current.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeCategory, shouldAnimate]);

  // Handle tab click
  const handleTabClick = useCallback(
    (slug: string | null) => {
      scrollToCategory(slug);
      onCategoryClick?.(slug);
    },
    [scrollToCategory, onCategoryClick]
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
        "sticky top-[72px] z-20",
        "bg-surface-primary/95 backdrop-blur-lg",
        "border-b border-border-subtle",
        className
      )}
    >
      {/* Left fade indicator */}
      {showLeftFade && (
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-8 z-0",
            "bg-gradient-to-r from-surface-primary/95 to-transparent",
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
            <button
              key={tab.slug ?? "all"}
              ref={isActive ? activeTabRef : null}
              role="tab"
              aria-selected={isActive}
              aria-controls={tab.slug ? `category-${tab.slug}` : undefined}
              onClick={() => handleTabClick(tab.slug)}
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
                  layoutId="v8ActiveTabPill"
                  className="absolute inset-0 rounded-pill bg-primary shadow-sm"
                  transition={shouldAnimate ? spring.snappy : { duration: 0 }}
                />
              )}

              {/* Tab label */}
              <span className="relative z-0">
                {tab.nameEn || tab.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right fade indicator */}
      {showRightFade && (
        <div
          className={cn(
            "absolute right-0 top-0 bottom-0 w-8 z-0",
            "bg-gradient-to-l from-surface-primary/95 to-transparent",
            "pointer-events-none"
          )}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default CategoryTabsV8;
