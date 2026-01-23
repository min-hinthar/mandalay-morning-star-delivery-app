"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { MenuCategory } from "@/types/menu";
import { cn } from "@/lib/utils/cn";
import { v6SpringSnappy } from "@/lib/motion";

interface CategoryTabsProps {
  categories: MenuCategory[];
  activeCategory: string | null;
  onCategoryClick: (slug: string | null) => void;
  /** Additional class names for the nav container */
  className?: string;
  /** Whether to apply sticky positioning (default: true) */
  sticky?: boolean;
}

/**
 * V6 Category Tabs - Pepper Aesthetic
 *
 * Features:
 * - Pill-shaped tabs with V6 primary color
 * - Framer Motion layoutId for smooth active indicator animation
 * - Horizontal scroll with fade edges on mobile
 * - V6 spring-based transitions
 */
export function CategoryTabs({
  categories,
  activeCategory,
  onCategoryClick,
  className,
  sticky = true,
}: CategoryTabsProps) {
  const tabRefs = useRef<Map<string | null, HTMLButtonElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Track scroll position for fade indicators
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  // Update fade indicators on scroll
  const updateScrollIndicators = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const threshold = 10;

    setShowLeftFade(scrollLeft > threshold);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - threshold);
  }, []);

  // Initial check and resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateScrollIndicators();

    const resizeObserver = new ResizeObserver(updateScrollIndicators);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [updateScrollIndicators, categories]);

  // Scroll active tab into view
  useEffect(() => {
    const activeTab = tabRefs.current.get(activeCategory);
    const container = containerRef.current;

    if (activeTab && container) {
      const tabRect = activeTab.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
        activeTab.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [activeCategory, prefersReducedMotion]);

  const setTabRef = useCallback(
    (slug: string | null) => (el: HTMLButtonElement | null) => {
      if (el) {
        tabRefs.current.set(slug, el);
      } else {
        tabRefs.current.delete(slug);
      }
    },
    []
  );

  const tabs = [
    { slug: null, name: "All" },
    ...categories.map((category) => ({ slug: category.slug, name: category.name })),
  ];

  return (
    <nav
      aria-label="Menu categories"
      className={cn(
        sticky && "sticky top-[72px] z-sticky",
        // V6 Surface with blur
        "bg-surface-primary/95 backdrop-blur-lg",
        "border-b border-border-subtle",
        className
      )}
    >
      <div className="relative">
        {/* V6 Left fade indicator */}
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none",
            "bg-gradient-to-r from-surface-primary to-transparent",
            "transition-opacity duration-fast",
            showLeftFade ? "opacity-100" : "opacity-0"
          )}
          aria-hidden="true"
        />

        {/* V6 Right fade indicator */}
        <div
          className={cn(
            "absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none",
            "bg-gradient-to-l from-surface-primary to-transparent",
            "transition-opacity duration-fast",
            showRightFade ? "opacity-100" : "opacity-0"
          )}
          aria-hidden="true"
        />

        {/* V6 Scrollable container */}
        <div
          ref={containerRef}
          role="tablist"
          className={cn(
            "flex overflow-x-auto scrollbar-hide",
            "px-4 py-3 gap-2",
            // Center tabs when they fit
            "md:justify-center"
          )}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          onScroll={updateScrollIndicators}
        >
          {tabs.map((tab) => {
            const isActive = activeCategory === tab.slug;
            const controlsId = tab.slug ? `category-${tab.slug}` : undefined;

            return (
              <motion.button
                key={tab.slug ?? "all"}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={controlsId}
                ref={setTabRef(tab.slug)}
                onClick={() => onCategoryClick(tab.slug)}
                className={cn(
                  // V6 Tab base styles
                  "relative flex-shrink-0 px-5 py-2.5",
                  "rounded-pill",
                  "font-body text-sm font-semibold",
                  "min-h-[44px]",
                  // V6 Motion
                  "transition-all duration-fast ease-default",
                  // V6 Focus ring
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  isActive
                    ? "text-text-inverse"
                    : [
                        "text-text-secondary",
                        "hover:text-text-primary hover:bg-surface-secondary",
                        "active:scale-95",
                      ]
                )}
                whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
                whileHover={!isActive && !prefersReducedMotion ? { y: -2 } : undefined}
              >
                {/* V6 Active background pill with layoutId animation */}
                {isActive && (
                  <motion.div
                    layoutId="v6ActiveTabPill"
                    className={cn(
                      "absolute inset-0 rounded-pill",
                      "bg-primary",
                      "shadow-sm"
                    )}
                    initial={false}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : v6SpringSnappy
                    }
                  />
                )}
                <span className="relative z-10">{tab.name}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
