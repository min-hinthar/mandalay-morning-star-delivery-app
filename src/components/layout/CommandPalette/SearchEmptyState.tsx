"use client";

import { Command } from "cmdk";
import { motion } from "framer-motion";
import { Clock, TrendingUp, X } from "lucide-react";
import Image from "next/image";
import { spring, staggerItem } from "@/lib/motion-tokens";
import { formatPrice } from "@/lib/utils/format";
import type { MenuItem } from "@/types/menu";

// Hardcoded popular item suggestions for empty state
const POPULAR_ITEM_SLUGS = [
  "mohinga",
  "tea-leaf-salad",
  "shan-noodles",
  "samosa",
];

export interface SearchEmptyStateProps {
  /** Recent search terms */
  recentSearches: string[];
  /** Callback when a recent search is selected */
  onSelectRecent: (term: string) => void;
  /** Callback to clear recent searches */
  onClearRecent: () => void;
  /** Popular menu items to suggest */
  popularItems?: MenuItem[];
  /** Callback when a menu item is selected */
  onSelectItem: (item: MenuItem) => void;
}

/**
 * Empty state for command palette showing recent searches and popular items
 *
 * Displays when the search input is empty:
 * - Recent searches section (if any exist)
 * - Popular items section with thumbnails
 * - Friendly message when no history
 */
export function SearchEmptyState({
  recentSearches,
  onSelectRecent,
  onClearRecent,
  popularItems = [],
  onSelectItem,
}: SearchEmptyStateProps) {
  // Filter popular items to show only the predefined slugs (in order)
  const filteredPopular = POPULAR_ITEM_SLUGS.map((slug) =>
    popularItems.find((item) => item.slug === slug)
  ).filter((item): item is MenuItem => Boolean(item));

  // Fall back to first 4 items if none match
  const displayItems = filteredPopular.length > 0 ? filteredPopular : popularItems.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.gentle}
      className="py-2"
    >
      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <Command.Group heading={null}>
          <div className="flex items-center justify-between px-3 py-1.5 text-xs text-text-muted">
            <span className="flex items-center gap-1.5 font-medium uppercase tracking-wide">
              <Clock className="h-3 w-3" />
              Recent Searches
            </span>
            <button
              type="button"
              onClick={onClearRecent}
              className="flex items-center gap-1 text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="h-3 w-3" />
              <span>Clear</span>
            </button>
          </div>
          {recentSearches.map((term, index) => (
            <Command.Item
              key={`recent-${term}`}
              value={`recent:${term}`}
              onSelect={() => onSelectRecent(term)}
              className="relative flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm outline-none transition-colors data-[selected=true]:bg-primary/5"
            >
              <motion.div
                variants={staggerItem}
                initial="hidden"
                animate="visible"
                custom={index}
              >
                <Clock className="h-4 w-4 text-text-muted" />
              </motion.div>
              <span className="text-text-primary">{term}</span>
            </Command.Item>
          ))}
        </Command.Group>
      )}

      {/* Popular Items */}
      {displayItems.length > 0 && (
        <Command.Group heading={null}>
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-text-muted">
            <TrendingUp className="h-3 w-3" />
            Popular Items
          </div>
          {displayItems.map((item, index) => (
            <Command.Item
              key={item.id}
              value={`popular:${item.nameEn}`}
              onSelect={() => onSelectItem(item)}
              className="relative flex cursor-pointer items-center gap-3 px-3 py-2.5 outline-none transition-colors data-[selected=true]:bg-primary/5"
            >
              <motion.div
                variants={staggerItem}
                initial="hidden"
                animate="visible"
                custom={index}
                className="flex w-full items-center gap-3"
              >
                {/* Thumbnail */}
                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-surface-secondary">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.nameEn}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-text-muted">
                      <span className="text-lg">
                        {item.nameEn.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Name */}
                <span className="flex-1 truncate text-sm text-text-primary">
                  {item.nameEn}
                </span>

                {/* Price */}
                <span className="text-sm text-text-muted">
                  {formatPrice(item.basePriceCents)}
                </span>
              </motion.div>
            </Command.Item>
          ))}
        </Command.Group>
      )}

      {/* Empty state when no recent searches and no popular items */}
      {recentSearches.length === 0 && displayItems.length === 0 && (
        <div className="px-3 py-8 text-center">
          <p className="text-sm text-text-muted">
            Search for your favorite dishes...
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default SearchEmptyState;
