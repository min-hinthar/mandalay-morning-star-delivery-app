"use client";

import { useCallback, useMemo, useState } from "react";
import { useMenuSearch } from "@/lib/hooks/useMenu";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useCart } from "@/lib/hooks/useCart";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import type { MenuCategory, MenuItem } from "@/types/menu";
import type { SelectedModifier } from "@/lib/utils/price";
import { MenuAccordion } from "./MenuAccordion";
import { MenuItemCard } from "./v7-index";
import { ItemDetailModal } from "./item-detail-modal";
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

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const handleItemSelect = useCallback((item: MenuItem) => {
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

      {isSearchMode ? (
        <SearchResultsGrid
          items={searchResults?.data.items ?? []}
          query={debouncedQuery}
          onItemSelect={handleItemSelect}
          onClearSearch={handleClearSearch}
          isLoading={isSearching}
        />
      ) : (
        <div className="px-4 py-6">
          <MenuAccordion
            categories={visibleCategories}
            onItemClick={handleItemSelect}
            renderItem={(item) => (
              <MenuItemCard item={item} onSelect={() => handleItemSelect(item)} />
            )}
            defaultExpanded={visibleCategories[0]?.slug ? [visibleCategories[0].slug] : []}
            allowMultiple={true}
          />
        </div>
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
