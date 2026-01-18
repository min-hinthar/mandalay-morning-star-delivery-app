"use client";

import { useCallback, useMemo, useState } from "react";
import { useMenuSearch } from "@/lib/hooks/useMenu";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useActiveCategory } from "@/lib/hooks/useActiveCategory";
import { useCart } from "@/lib/hooks/useCart";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import type { MenuCategory, MenuItem } from "@/types/menu";
import type { SelectedModifier } from "@/lib/utils/price";
import { CategoryTabs } from "./category-tabs";
import { ItemDetailModal } from "./item-detail-modal";
import { MenuGrid } from "./menu-grid";
import { MenuHeader } from "./menu-header";
import { SearchResultsGrid } from "./search-results-grid";

interface MenuContentProps {
  categories: MenuCategory[];
}

export function MenuContent({ categories }: MenuContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { addItem } = useCart();
  const { open: openCart } = useCartDrawer();

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

  const { activeCategory, scrollToCategory: scrollToCategoryBase } = useActiveCategory(
    sectionIds,
    {
      rootMargin: "-56px 0px -80% 0px",
      headerHeight: 56,
    }
  );

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const scrollToCategory = useCallback(
    (slug: string | null) => {
      setSearchQuery("");
      scrollToCategoryBase(slug);
    },
    [scrollToCategoryBase]
  );

  const handleGridItemSelect = useCallback((item: MenuItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  }, []);

  const handleSearchItemSelect = useCallback((item: MenuItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedItem(null);
  }, []);

  const handleAddToCart = useCallback(
    (item: MenuItem, modifiers: SelectedModifier[], quantity: number, notes: string) => {
      addItem({
        menuItemId: item.id,
        menuItemSlug: item.slug,
        nameEn: item.nameEn,
        nameMy: item.nameMy,
        imageUrl: item.imageUrl,
        basePriceCents: item.basePriceCents,
        quantity,
        modifiers: modifiers.map((mod) => ({
          groupId: mod.groupId,
          groupName: mod.groupName,
          optionId: mod.optionId,
          optionName: mod.optionName,
          priceDeltaCents: mod.priceDeltaCents,
        })),
        notes,
      });
      openCart();
    },
    [addItem, openCart]
  );

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

      <ItemDetailModal
        item={selectedItem}
        open={isModalOpen}
        onClose={handleModalClose}
        onAddToCart={handleAddToCart}
      />
    </>
  );
}
