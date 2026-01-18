"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import type { MenuItem } from "@/types/menu";
import { MenuItemCard } from "./menu-item-card";
import { MenuEmptyState } from "./menu-empty-state";

interface SearchResultsGridProps {
  items: MenuItem[];
  query: string;
  onItemSelect: (item: MenuItem) => void;
  onClearSearch: () => void;
  isLoading?: boolean;
}

export function SearchResultsGrid({
  items,
  query,
  onItemSelect,
  onClearSearch,
  isLoading = false,
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <MenuItemCard item={item} onSelect={onItemSelect} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
