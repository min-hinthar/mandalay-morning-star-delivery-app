"use client";

import { motion } from "framer-motion";
import type { MenuItem } from "@/lib/queries/menu";
import { MenuItemCard } from "./menu-item-card";
import { MenuEmptyState } from "./menu-empty-state";

interface SearchResultsGridProps {
  items: MenuItem[];
  query: string;
  onItemSelect: (item: MenuItem) => void;
  onClearSearch: () => void;
}

export function SearchResultsGrid({
  items,
  query,
  onItemSelect,
  onClearSearch,
}: SearchResultsGridProps) {
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
