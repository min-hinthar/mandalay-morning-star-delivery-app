"use client";

import { useCallback, useMemo } from "react";
import { MenuCategory } from "@/lib/queries/menu";
import { useScrollSpy } from "@/lib/hooks/useScrollSpy";
import { CategoryTabs } from "./category-tabs";
import { MenuGrid } from "./menu-grid";

interface MenuContentProps {
  categories: MenuCategory[];
}

export function MenuContent({ categories }: MenuContentProps) {
  const visibleCategories = useMemo(
    () => categories.filter((category) => category.items.length > 0),
    [categories]
  );

  const sectionIds = useMemo(
    () => visibleCategories.map((category) => `category-${category.slug}`),
    [visibleCategories]
  );

  const activeSectionId = useScrollSpy(sectionIds);
  const activeCategory = activeSectionId
    ? activeSectionId.replace("category-", "")
    : null;

  const scrollToCategory = useCallback((slug: string | null) => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (slug === null) {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
      return;
    }

    const element = document.getElementById(`category-${slug}`);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;

      window.scrollTo({ top: y, behavior: prefersReducedMotion ? "auto" : "smooth" });
    }
  }, []);

  const handleItemSelect = useCallback(() => undefined, []);

  return (
    <>
      <CategoryTabs
        categories={visibleCategories}
        activeCategory={activeCategory}
        onCategoryClick={scrollToCategory}
      />

      <MenuGrid
        categories={visibleCategories}
        onItemSelect={handleItemSelect}
      />
    </>
  );
}
