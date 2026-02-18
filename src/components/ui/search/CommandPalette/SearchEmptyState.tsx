"use client";

import { Command } from "cmdk";
import { m } from "framer-motion";
import { Clock, Flame, TrendingUp, X } from "lucide-react";
import Image from "next/image";
import { spring, staggerItem } from "@/lib/motion-tokens";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { MenuItem } from "@/types/menu";

// Hardcoded popular item suggestions for empty state
const POPULAR_ITEM_SLUGS = ["mohinga", "tea-leaf-salad", "shan-noodles", "samosa"];

export interface SearchEmptyStateProps {
  /** Recent search terms */
  recentSearches: string[];
  /** Callback when a recent search is selected */
  onSelectRecent: (term: string) => void;
  /** Callback to remove a single recent search */
  onRemoveRecent: (term: string) => void;
  /** Callback to clear all recent searches */
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
 * - Recent searches with individual X delete and "Clear all"
 * - Popular items with 64px thumbnails and "Popular" badge
 * - Friendly message when no history
 */
export function SearchEmptyState({
  recentSearches,
  onSelectRecent,
  onRemoveRecent,
  onClearRecent,
  popularItems = [],
  onSelectItem,
}: SearchEmptyStateProps) {
  // Tag-based popular detection: items with "popular" tag
  const taggedPopular = popularItems.filter((item) => item.tags?.includes("popular"));

  // Slug-based fallback
  const slugPopular = POPULAR_ITEM_SLUGS.map((slug) =>
    popularItems.find((item) => item.slug === slug)
  ).filter((item): item is MenuItem => Boolean(item));

  // Priority: tagged > slug-based > first 4
  const displayItems =
    taggedPopular.length > 0
      ? taggedPopular.slice(0, 6)
      : slugPopular.length > 0
        ? slugPopular
        : popularItems.slice(0, 4);

  return (
    <m.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.gentle}
      className="py-2"
    >
      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <Command.Group heading="">
          <div className="flex items-center justify-between px-4 py-2 text-xs text-text-muted">
            <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider">
              <Clock className="h-3 w-3" />
              Recent
            </span>
            <button
              type="button"
              onClick={onClearRecent}
              className={cn(
                "rounded-md px-2 py-0.5 text-2xs font-medium",
                "text-text-muted hover:text-danger hover:bg-danger/8",
                "transition-all duration-150"
              )}
            >
              Clear all
            </button>
          </div>
          {recentSearches.map((term, index) => (
            <Command.Item
              key={`recent-${term}`}
              value={`recent:${term}`}
              onSelect={() => onSelectRecent(term)}
              className={cn(
                "group relative flex cursor-pointer items-center gap-3",
                "px-4 py-2.5 text-sm outline-none",
                "transition-all duration-150",
                "data-[selected=true]:bg-primary/8 dark:data-[selected=true]:bg-primary/15"
              )}
            >
              <m.div
                variants={staggerItem}
                initial="hidden"
                animate="visible"
                custom={index}
                className="flex w-full items-center gap-3"
              >
                {/* Clock icon with subtle background */}
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-surface-secondary/60">
                  <Clock className="h-3.5 w-3.5 text-text-muted" />
                </div>

                {/* Term */}
                <span className="flex-1 truncate text-text-primary">{term}</span>

                {/* Individual delete X button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onRemoveRecent(term);
                  }}
                  className={cn(
                    "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full",
                    "opacity-0 group-hover:opacity-100 group-data-[selected=true]:opacity-100",
                    "text-text-muted hover:text-text-primary hover:bg-surface-secondary",
                    "transition-all duration-150",
                    // Always visible on touch devices
                    "sm:opacity-0 max-sm:opacity-60"
                  )}
                  aria-label={`Remove "${term}" from recent searches`}
                >
                  <X className="h-3 w-3" />
                </button>
              </m.div>
            </Command.Item>
          ))}
        </Command.Group>
      )}

      {/* Popular Items */}
      {displayItems.length > 0 && (
        <Command.Group heading="">
          {/* Section divider when recent searches exist above */}
          {recentSearches.length > 0 && <div className="mx-4 my-1 border-t border-border/30" />}
          <div className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
            <TrendingUp className="h-3 w-3" />
            Popular
          </div>
          {displayItems.map((item, index) => (
            <Command.Item
              key={item.id}
              value={`popular:${item.nameEn}`}
              onSelect={() => onSelectItem(item)}
              className={cn(
                "relative flex cursor-pointer items-center gap-3",
                "px-4 py-2 outline-none",
                "transition-all duration-150",
                "data-[selected=true]:bg-primary/8 dark:data-[selected=true]:bg-primary/15"
              )}
            >
              <m.div
                variants={staggerItem}
                initial="hidden"
                animate="visible"
                custom={index}
                className="flex w-full items-center gap-3"
              >
                {/* 64px Thumbnail with premium styling */}
                <div
                  className={cn(
                    "relative h-[52px] w-[52px] flex-shrink-0 overflow-hidden rounded-xl",
                    "bg-surface-secondary ring-1 ring-border/10",
                    "shadow-sm"
                  )}
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.nameEn}
                      fill
                      sizes="52px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-text-muted">
                      <span className="text-lg font-medium">{item.nameEn.charAt(0)}</span>
                    </div>
                  )}
                </div>

                {/* Name + badge */}
                <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-text-primary">
                      {item.nameEn}
                    </span>
                    {/* Popular badge */}
                    <span
                      className={cn(
                        "inline-flex flex-shrink-0 items-center gap-0.5",
                        "rounded-full px-1.5 py-px",
                        "bg-amber-500/12 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400",
                        "text-2xs font-semibold uppercase tracking-wide"
                      )}
                    >
                      <Flame className="h-2.5 w-2.5" />
                      Popular
                    </span>
                  </div>
                  {/* Price */}
                  <span className="text-xs text-text-muted">
                    {formatPrice(item.basePriceCents)}
                  </span>
                </div>
              </m.div>
            </Command.Item>
          ))}
        </Command.Group>
      )}

      {/* Empty state when no recent searches and no popular items */}
      {recentSearches.length === 0 && displayItems.length === 0 && (
        <div className="px-4 py-10 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-secondary">
            <TrendingUp className="h-5 w-5 text-text-muted" />
          </div>
          <p className="text-sm text-text-muted">Search for your favorite dishes...</p>
        </div>
      )}
    </m.div>
  );
}

export default SearchEmptyState;
