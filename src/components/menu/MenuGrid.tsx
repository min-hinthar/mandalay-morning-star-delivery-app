"use client";

/**
 * @deprecated Use MenuContent from @/components/ui/menu instead.
 * This component is kept for backwards compatibility.
 */

import { AnimatePresence, motion } from "framer-motion";
import type { MenuCategory, MenuItem } from "@/types/menu";
import { MenuSection } from "./menu-section";
import { MenuEmptyState } from "./MenuEmptyState";

interface MenuGridProps {
  categories: MenuCategory[];
  onItemSelect: (item: MenuItem) => void;
  isSearchMode?: boolean;
  searchQuery?: string;
  onClearSearch?: () => void;
}

export function MenuGrid({
  categories,
  onItemSelect,
  isSearchMode = false,
  searchQuery = "",
  onClearSearch,
}: MenuGridProps) {
  const nonEmptyCategories = categories.filter(
    (category) => category.items.length > 0
  );

  if (nonEmptyCategories.length === 0) {
    if (isSearchMode) {
      return (
        <MenuEmptyState
          type="no-results"
          searchQuery={searchQuery}
          onClearSearch={onClearSearch}
        />
      );
    }
    return <MenuEmptyState type="no-menu" />;
  }

  return (
    <div className="space-y-8 px-4 pb-8 pt-2">
      <AnimatePresence mode="popLayout">
        {nonEmptyCategories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.05 }}
          >
            <MenuSection
              id={`category-${category.slug}`}
              category={category}
              onItemSelect={onItemSelect}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
