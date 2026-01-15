"use client";

import { useRef, useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { MenuCategory } from "@/types/menu";
import { cn } from "@/lib/utils/cn";

interface CategoryTabsProps {
  categories: MenuCategory[];
  activeCategory: string | null;
  onCategoryClick: (slug: string | null) => void;
}

export function CategoryTabs({
  categories,
  activeCategory,
  onCategoryClick,
}: CategoryTabsProps) {
  const tabRefs = useRef<Map<string | null, HTMLButtonElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

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
      className="sticky top-16 z-20 bg-background/95 backdrop-blur-sm border-b border-border"
    >
      <div
        ref={containerRef}
        role="tablist"
        className="flex overflow-x-auto scrollbar-hide px-4 py-3 gap-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
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
                "relative flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium",
                "min-h-[44px] min-w-[44px]",
                "transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2",
                isActive
                  ? "text-white"
                  : "text-foreground/70 hover:text-foreground hover:bg-muted"
              )}
              whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabBackground"
                  className="absolute inset-0 bg-brand-red rounded-full"
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
    </nav>
  );
}
