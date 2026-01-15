"use client";

import { useCallback, useMemo, useState } from "react";
import { MenuCategory, MenuItem as GridMenuItem } from "@/lib/queries/menu";
import { useMenuSearch } from "@/lib/hooks/useMenu";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useScrollSpy } from "@/lib/hooks/useScrollSpy";
import { CategoryTabs } from "./category-tabs";
import { MenuGrid } from "./menu-grid";
import { MenuHeader } from "./menu-header";
import { SearchResultsGrid } from "./search-results-grid";
import type { MenuItem as SearchMenuItem } from "@/types/menu";

interface MenuContentProps {
  categories: MenuCategory[];
}

export function MenuContent({ categories }: MenuContentProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const visibleCategories = useMemo(
    () => categories.filter((category) => category.items.length > 0),
    [categories]
  );

  const trimmedQuery = searchQuery.trim();
  const debouncedQuery = useDebounce(trimmedQuery, 300);
  const isSearchMode = trimmedQuery.length > 0;

  const { data: searchResults, isFetching: isSearching } =
    useMenuSearch(debouncedQuery);

  const sectionIds = useMemo(
    () => visibleCategories.map((category) => `category-${category.slug}`),
    [visibleCategories]
  );

  const activeSectionId = useScrollSpy(sectionIds, { offset: 160 });
  const activeCategory = activeSectionId
    ? activeSectionId.replace("category-", "")
    : null;

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const scrollToCategory = useCallback((slug: string | null) => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const headerOffset = 140;

    setSearchQuery("");

    if (slug === null) {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
      return;
    }

    const element = document.getElementById(`category-${slug}`);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - headerOffset;

      window.scrollTo({
        top: y,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    }
  }, []);

  const handleGridItemSelect = useCallback((item: GridMenuItem) => {
    void item;
  }, []);

  const handleSearchItemSelect = useCallback((item: SearchMenuItem) => {
    void item;
  }, []);

  return (
    <>
      <MenuHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
        isSearching={isSearching && isSearchMode}
      />

      {!isSearchMode && (
        <CategoryTabs
          categories={visibleCategories}
          activeCategory={activeCategory}
          onCategoryClick={scrollToCategory}
        />
      )}

      {isSearchMode ? (
        <SearchResultsGrid
          items={searchResults?.data.items ?? []}
          query={debouncedQuery}
          onItemSelect={handleSearchItemSelect}
          onClearSearch={handleClearSearch}
          isLoading={isSearching}
        />
      ) : (
        <MenuGrid
          categories={visibleCategories}
          onItemSelect={handleGridItemSelect}
        />
      )}
    </>
  );
}
