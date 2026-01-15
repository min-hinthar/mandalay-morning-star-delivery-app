"use client";

import { CartButton } from "@/components/cart/cart-button";
import { SearchInput } from "./search-input";

interface MenuHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  isSearching?: boolean;
}

export function MenuHeader({
  searchQuery,
  onSearchChange,
  onClearSearch,
  isSearching = false,
}: MenuHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <h1 className="font-display text-lg text-brand-red sm:text-xl">
          Our Menu
        </h1>

        <div className="flex items-center gap-2">
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            onClear={onClearSearch}
            isLoading={isSearching}
          />
          <CartButton />
        </div>
      </div>
    </header>
  );
}
