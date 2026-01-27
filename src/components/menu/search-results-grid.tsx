"use client";

import { Loader2 } from "lucide-react";
import type { MenuItem } from "@/types/menu";
import { UnifiedMenuItemCard } from "./UnifiedMenuItemCard";
import { MenuCardWrapper } from "./MenuCardWrapper";
import { MenuEmptyState } from "./MenuEmptyState";

interface SearchResultsGridProps {
  items: MenuItem[];
  query: string;
  onItemSelect: (item: MenuItem) => void;
  onClearSearch: () => void;
  isLoading?: boolean;
  isFavorite?: (itemId: string) => boolean;
  onFavoriteToggle?: (item: MenuItem) => void;
}

export function SearchResultsGrid({
  items,
  query,
  onItemSelect,
  onClearSearch,
  isLoading = false,
  isFavorite,
  onFavoriteToggle,
}: SearchResultsGridProps) {

  if (isLoading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted">
          Searching{query ? ` for "${query}"` : ""}...
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <MenuEmptyState
        type="no-results"
        searchQuery={query}
        onClearSearch={onClearSearch}
      />
    );
  }

  return (
    <div className="px-4 pb-8 pt-6">
      <div className="mb-4">
        <h2 className="text-xl font-display text-foreground">
          Search Results
          <span className="ml-2 text-sm font-normal text-muted">
            ({items.length} {items.length === 1 ? "item" : "items"} for &quot;
            {query}&quot;)
          </span>
        </h2>
      </div>

      {/* Responsive grid: 1 col mobile, 2 cols tablet, 3 cols desktop */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <MenuCardWrapper
            key={item.id}
            itemId={item.id}
            index={index}
            replayOnScroll={true}
          >
            <UnifiedMenuItemCard
              item={item}
              variant="menu"
              onSelect={onItemSelect}
              isFavorite={isFavorite?.(item.id)}
              onFavoriteToggle={
                onFavoriteToggle
                  ? (menuItem) => onFavoriteToggle(menuItem)
                  : undefined
              }
              priority={index < 4}
            />
          </MenuCardWrapper>
        ))}
      </div>
    </div>
  );
}
