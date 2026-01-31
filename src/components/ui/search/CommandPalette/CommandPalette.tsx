"use client";

import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useRecentSearches } from "@/lib/hooks";
import { cn } from "@/lib/utils/cn";
import { zClass } from "@/lib/design-system/tokens/z-index";
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
    if (!query.trim() || !menuItems?.length) return [];
    const lowerQuery = query.toLowerCase();
    return menuItems.filter(
      (item) =>
        item.nameEn?.toLowerCase().includes(lowerQuery) ||
        (item.descriptionEn && item.descriptionEn.toLowerCase().includes(lowerQuery))
    );
  }, [menuItems, query]);

  // Handle item selection - navigate to menu with item query param to open modal
  const handleSelectItem = useCallback(
    (item: MenuItem) => {
      addSearch(item.nameEn);
      onOpenChange(false);
      setQuery("");
      router.push(`/menu?item=${item.slug}`);
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
              "fixed inset-0",
              zClass.modalBackdrop,
              // MOBILE CRASH PREVENTION: No backdrop-blur on mobile (causes Safari crashes)
              "bg-overlay sm:backdrop-blur-sm"
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
              "fixed",
              zClass.modal,
              "top-[15%] sm:top-[20%]",
              "left-1/2 -translate-x-1/2",
              "w-[calc(100%-2rem)] max-w-sm sm:max-w-lg"
            )}
          >
            {/* Mobile close button */}
            <button
              onClick={() => handleOpenChange(false)}
              className={cn(
                "absolute -top-12 right-0 sm:hidden",
                "h-10 w-10 flex items-center justify-center rounded-full",
                // MOBILE CRASH PREVENTION: No backdrop-blur on mobile (causes Safari crashes)
                "bg-surface-primary",
                "text-text-secondary",
                "shadow-lg border border-border/20",
                "active:scale-95 transition-transform"
              )}
              aria-label="Close search"
            >
              <X className="h-5 w-5" />
            </button>

            <Command
              label="Search menu items"
              className={cn(
                "rounded-xl overflow-hidden",
                "border border-border/20",
                "shadow-2xl",
                // MOBILE CRASH PREVENTION: Blur only on sm+ to prevent Safari crashes
                "sm:backdrop-blur-xl"
              )}
              style={{
                // MOBILE CRASH PREVENTION: backdropFilter removed from inline styles
                backgroundColor: "var(--color-surface-primary-85)",
              }}
              shouldFilter={false}
            >
              {/* Search Input */}
              <SearchInput
                placeholder="Search menu items..."
                value={query}
                onValueChange={setQuery}
              />

              {/* Dark mode glassmorphism override */}
              <style jsx global>{`
                .dark [data-cmdk-root] {
                  background-color: rgba(24, 24, 27, 0.9) !important;
                  border-color: rgba(255, 255, 255, 0.1) !important;
                }
              `}</style>

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
