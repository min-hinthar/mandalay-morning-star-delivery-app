"use client";

import { useRef, useEffect } from "react";
import { MenuCategory } from "@/lib/queries/menu";
import { cn } from "@/lib/utils/cn";

interface CategoryTabsProps {
  categories: MenuCategory[];
  activeCategory: string;
  onCategoryClick: (slug: string) => void;
}

export function CategoryTabs({
  categories,
  activeCategory,
  onCategoryClick,
}: CategoryTabsProps) {
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeTab = tabRefs.current.get(activeCategory);
    const container = containerRef.current;

    if (activeTab && container) {
      const tabLeft = activeTab.offsetLeft;
      const tabWidth = activeTab.offsetWidth;
      const containerWidth = container.offsetWidth;
      const scrollLeft = container.scrollLeft;

      if (tabLeft < scrollLeft || tabLeft + tabWidth > scrollLeft + containerWidth) {
        const prefersReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;
        container.scrollTo({
          left: tabLeft - containerWidth / 2 + tabWidth / 2,
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
      }
    }
  }, [activeCategory]);

  return (
    <div className="sticky top-0 z-10 bg-background border-b border-gray-200">
      <div
        ref={containerRef}
        className="flex overflow-x-auto scrollbar-hide px-4 py-2 gap-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            ref={(el) => {
              if (el) tabRefs.current.set(category.slug, el);
            }}
            onClick={() => onCategoryClick(category.slug)}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors",
              "min-h-[44px] min-w-[44px]",
              activeCategory === category.slug
                ? "bg-brand-red text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
