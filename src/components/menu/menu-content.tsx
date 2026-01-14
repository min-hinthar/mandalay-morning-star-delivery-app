"use client";

import { useRef, useState, useEffect } from "react";
import { MenuCategory } from "@/lib/queries/menu";
import { CategoryTabs } from "./category-tabs";
import { MenuSection } from "./menu-section";

interface MenuContentProps {
  categories: MenuCategory[];
}

export function MenuContent({ categories }: MenuContentProps) {
  const [activeCategory, setActiveCategory] = useState(
    categories[0]?.slug || ""
  );
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    if (!activeCategory && categories[0]?.slug) {
      setActiveCategory(categories[0].slug);
    }
  }, [activeCategory, categories]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;

      for (const category of categories) {
        const element = sectionRefs.current.get(category.slug);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveCategory((prev) =>
              prev === category.slug ? prev : category.slug
            );
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categories]);

  const scrollToCategory = (slug: string) => {
    const element = sectionRefs.current.get(slug);
    if (element) {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;

      window.scrollTo({ top: y, behavior: prefersReducedMotion ? "auto" : "smooth" });
    }
  };

  const setSectionRef = (slug: string) => (el: HTMLElement | null) => {
    if (el) {
      sectionRefs.current.set(slug, el);
    } else {
      sectionRefs.current.delete(slug);
    }
  };

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
            ref={setSectionRef(category.slug)}
          />
        ))}
      </div>
    </>
  );
}
