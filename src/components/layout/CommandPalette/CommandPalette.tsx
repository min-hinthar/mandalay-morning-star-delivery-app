"use client";

import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useRecentSearches } from "@/lib/hooks";
import { cn } from "@/lib/utils/cn";
import type { MenuItem } from "@/types/menu";
import { SearchInput } from "./SearchInput";
import { SearchResults } from "./SearchResults";
import { SearchEmptyState } from "./SearchEmptyState";

export interface CommandPaletteProps {
  /** Whether the palette is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Menu items to search */
  menuItems: MenuItem[];
}

// Linear-like animation: scale up + fade + slide down
const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

const dialogVariants = {
  initial: {
    opacity: 0,
    scale: 0.96,
    y: -10,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 500,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: -10,
    transition: { duration: 0.1 },
  },
};

/**
 * Linear-style command palette for menu item search
 *
 * Features:
 * - cmdk integration for keyboard navigation and filtering
 * - Recent searches with localStorage persistence
 * - Popular item suggestions in empty state
 * - Animated entrance/exit with spring physics
 * - Mobile-responsive design
 */
export function CommandPalette({
  open,
  onOpenChange,
  menuItems,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { recentSearches, addSearch, clearSearches } = useRecentSearches();

  // Filter items based on query (cmdk handles this, but we need the filtered list for display)
  const filteredItems = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return menuItems.filter(
      (item) =>
        item.nameEn.toLowerCase().includes(lowerQuery) ||
        item.descriptionEn?.toLowerCase().includes(lowerQuery)
    );
  }, [menuItems, query]);

  // Handle item selection
  const handleSelectItem = useCallback(
    (item: MenuItem) => {
      addSearch(item.nameEn);
      onOpenChange(false);
      setQuery("");
      router.push(`/menu/${item.slug}`);
    },
    [addSearch, onOpenChange, router]
  );

  // Handle recent search selection
  const handleSelectRecent = useCallback(
    (term: string) => {
      setQuery(term);
    },
    []
  );

  // Handle dialog close
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setQuery("");
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="command-palette-backdrop"
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={() => handleOpenChange(false)}
            className={cn(
              "fixed inset-0 z-modal-backdrop",
              "bg-black/50 backdrop-blur-sm"
            )}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            key="command-palette-dialog"
            variants={dialogVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              "fixed z-modal",
              "top-[15%] sm:top-[20%]",
              "left-1/2 -translate-x-1/2",
              "w-[calc(100%-2rem)] max-w-sm sm:max-w-lg"
            )}
          >
            <Command
              label="Search menu items"
              className={cn(
                "rounded-xl border border-border bg-background shadow-2xl",
                "overflow-hidden"
              )}
              shouldFilter={false}
            >
              {/* Search Input */}
              <SearchInput placeholder="Search menu items..." />

              {/* Results List */}
              <Command.List className="max-h-[60vh] overflow-y-auto">
                {/* Empty state when no query */}
                {!query.trim() && (
                  <SearchEmptyState
                    recentSearches={recentSearches}
                    onSelectRecent={handleSelectRecent}
                    onClearRecent={clearSearches}
                    popularItems={menuItems}
                    onSelectItem={handleSelectItem}
                  />
                )}

                {/* Search results when query has matches */}
                {query.trim() && filteredItems.length > 0 && (
                  <SearchResults
                    items={filteredItems}
                    onSelect={handleSelectItem}
                  />
                )}

                {/* No results message */}
                {query.trim() && filteredItems.length === 0 && (
                  <Command.Empty className="px-4 py-8 text-center text-sm text-text-muted">
                    No items found for &ldquo;{query}&rdquo;
                  </Command.Empty>
                )}
              </Command.List>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CommandPalette;
