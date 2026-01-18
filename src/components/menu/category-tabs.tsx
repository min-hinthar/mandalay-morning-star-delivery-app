"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { MenuCategory } from "@/types/menu";
import { cn } from "@/lib/utils/cn";

interface CategoryTabsProps {
  categories: MenuCategory[];
  activeCategory: string | null;
  onCategoryClick: (slug: string | null) => void;
}

/**
 * V3 Category Tabs
 * Horizontal scrollable category navigation with scroll fade indicators
 */
export function CategoryTabs({
  categories,
  activeCategory,
  onCategoryClick,
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
        "sticky top-14 z-20",
        "bg-[var(--color-cream)]/95 backdrop-blur-md",
        "border-b border-[var(--color-border)]",
        "shadow-[var(--shadow-sm)]"
      )}
    >
      <div className="relative">
        {/* Left fade indicator */}
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none",
            "bg-gradient-to-r from-[var(--color-cream)] to-transparent",
            "transition-opacity duration-[var(--duration-fast)]",
            showLeftFade ? "opacity-100" : "opacity-0"
          )}
          aria-hidden="true"
        />

        {/* Right fade indicator */}
        <div
          className={cn(
            "absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none",
            "bg-gradient-to-l from-[var(--color-cream)] to-transparent",
            "transition-opacity duration-[var(--duration-fast)]",
            showRightFade ? "opacity-100" : "opacity-0"
          )}
          aria-hidden="true"
        />

        {/* Scrollable container */}
        <div
          ref={containerRef}
          role="tablist"
          className={cn(
            "flex overflow-x-auto scrollbar-hide",
            "px-[var(--space-4)] py-3 gap-[var(--space-2)]"
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
                  "relative flex-shrink-0 px-[var(--space-4)] py-2.5",
                  "rounded-full text-sm font-semibold",
                  "min-h-[44px] min-w-[44px]",
                  "transition-all duration-[var(--duration-fast)] ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cta)] focus-visible:ring-offset-2",
                  isActive
                    ? "text-white"
                    : [
                        "text-[var(--color-charcoal-muted)]",
                        "hover:text-[var(--color-charcoal)] hover:bg-[var(--color-cream-darker)]",
                        "active:scale-95",
                      ]
                )}
                whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
                whileHover={!isActive && !prefersReducedMotion ? { y: -1 } : undefined}
              >
                {/* Active background pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabBackground"
                    className={cn(
                      "absolute inset-0 rounded-full",
                      "bg-[var(--color-cta)]",
                      "shadow-[var(--shadow-glow-primary)]"
                    )}
                    initial={false}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 500, damping: 30 }
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
