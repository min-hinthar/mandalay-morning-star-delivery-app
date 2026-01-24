"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import type { MenuItem } from "@/types/menu";

// ============================================
// TYPES
// ============================================

export interface SearchAutocompleteProps {
  /** Search results to display */
  items: MenuItem[];
  /** Loading state */
  isLoading: boolean;
  /** Whether dropdown is open */
  isOpen: boolean;
  /** Callback when item is selected */
  onSelect: (item: MenuItem) => void;
  /** Current search query (for highlighting) */
  query: string;
  /** Additional className */
  className?: string;
}

// ============================================
// ANIMATION VARIANTS
// ============================================

const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: -8,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.03 },
  }),
};

// ============================================
// SEARCH RESULT ITEM
// ============================================

interface SearchResultItemProps {
  item: MenuItem;
  index: number;
  onSelect: (item: MenuItem) => void;
  query: string;
  shouldAnimate: boolean;
}

function SearchResultItem({
  item,
  index,
  onSelect,
  query,
  shouldAnimate,
}: SearchResultItemProps) {
  // Highlight matching text in name
  const highlightMatch = (text: string): React.ReactNode => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-amber-200 dark:bg-amber-800/50 text-inherit rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <motion.button
      type="button"
      // Use onMouseDown to prevent blur-before-click issue
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect(item);
      }}
      custom={index}
      variants={shouldAnimate ? itemVariants : undefined}
      initial={shouldAnimate ? "hidden" : undefined}
      animate={shouldAnimate ? "visible" : undefined}
      whileHover={shouldAnimate ? { backgroundColor: "var(--color-surface-secondary)" } : undefined}
      className={cn(
        "w-full flex items-center gap-3 p-3",
        "text-left transition-colors",
        "hover:bg-surface-secondary",
        "focus-visible:outline-none focus-visible:bg-surface-secondary",
        "border-b border-border last:border-b-0"
      )}
    >
      {/* Thumbnail */}
      <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-surface-secondary">
        {item.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element -- Dynamic external URL */
          <img
            src={item.imageUrl}
            alt={item.nameEn}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl text-text-muted">
            <span role="img" aria-hidden="true">
              {"\u{1F35C}"}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary truncate">
          {highlightMatch(item.nameEn)}
        </p>
        {item.nameMy && (
          <p className="text-sm text-text-secondary truncate">
            {item.nameMy}
          </p>
        )}
      </div>

      {/* Price */}
      <div className="flex-shrink-0 text-right">
        <p className="font-semibold text-primary">
          ${(item.basePriceCents / 100).toFixed(2)}
        </p>
        {item.isSoldOut && (
          <p className="text-xs text-red-500">Sold out</p>
        )}
      </div>
    </motion.button>
  );
}

// ============================================
// LOADING STATE
// ============================================

function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-2 p-4 text-text-secondary">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-sm">Searching...</span>
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

function EmptyState({ query }: { query: string }) {
  return (
    <div className="p-4 text-center text-text-secondary">
      <p className="text-sm">
        No results for &ldquo;{query}&rdquo;
      </p>
      <p className="text-xs mt-1 text-text-muted">
        Try a different search term
      </p>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SearchAutocomplete({
  items,
  isLoading,
  isOpen,
  onSelect,
  query,
  className,
}: SearchAutocompleteProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={shouldAnimate ? dropdownVariants : undefined}
          initial={shouldAnimate ? "hidden" : undefined}
          animate={shouldAnimate ? "visible" : undefined}
          exit={shouldAnimate ? "exit" : undefined}
          transition={getSpring(spring.snappy)}
          className={cn(
            "absolute left-0 right-0 top-full mt-1",
            "bg-surface-primary rounded-xl",
            "border border-border",
            "shadow-lg",
            "overflow-hidden",
            "z-10",
            "max-h-80 overflow-y-auto",
            className
          )}
        >
          {isLoading ? (
            <LoadingState />
          ) : items.length === 0 ? (
            <EmptyState query={query} />
          ) : (
            <div>
              {items.map((item, index) => (
                <SearchResultItem
                  key={item.id}
                  item={item}
                  index={index}
                  onSelect={onSelect}
                  query={query}
                  shouldAnimate={shouldAnimate}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SearchAutocomplete;
