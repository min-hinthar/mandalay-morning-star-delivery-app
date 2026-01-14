"use client";

import { useCallback, useMemo } from "react";
import { MenuCategory } from "@/lib/queries/menu";
import { useScrollSpy } from "@/lib/hooks/useScrollSpy";
import { CategoryTabs } from "./category-tabs";
import { MenuSection } from "./menu-section";

interface MenuContentProps {
  categories: MenuCategory[];
}

export function MenuContent({ categories }: MenuContentProps) {
  const sectionIds = useMemo(
    () => categories.map((category) => `category-${category.slug}`),
    [categories]
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

  return (
    <>
      <CategoryTabs
        categories={categories}
        activeCategory={activeCategory}
        onCategoryClick={scrollToCategory}
      />

      <div className="px-4 pb-8 pt-2">
        {categories.map((category) => (
          <MenuSection
            key={category.id}
            category={category}
            id={`category-${category.slug}`}
          />
        ))}
      </div>
    </>
  );
}
