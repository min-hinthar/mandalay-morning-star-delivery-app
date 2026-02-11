"use client";

import { Command } from "cmdk";
import { AnimatePresence, m } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useRecentSearches } from "@/lib/hooks";
import { useAuth } from "@/lib/hooks/useAuth";
import { useOrderHistorySearch } from "@/lib/hooks/useOrderHistorySearch";
import { cn } from "@/lib/utils/cn";
import { zClass } from "@/lib/design-system/tokens/z-index";
import { useCartStore } from "@/lib/stores/cart-store";
import type { MenuItem, MenuCategory } from "@/types/menu";
import type { SelectedModifier } from "@/lib/utils/price";
import { useFuzzySearch, deriveCategoryTabs } from "@/lib/search";
import type { EnrichedMenuItem } from "@/lib/search";
import { ItemDetailSheet } from "@/components/ui/menu/ItemDetailSheet";
import { SearchInput } from "./SearchInput";
import { SearchResults } from "./SearchResults";
import { SearchEmptyState } from "./SearchEmptyState";
import { SearchOrderHistory } from "./SearchOrderHistory";
import { SearchCategoryTabs } from "./SearchCategoryTabs";
import { SearchSkeleton } from "./SearchSkeleton";
import { NoResultsState } from "./NoResultsState";

export interface CommandPaletteProps {
  /** Whether the palette is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Menu categories containing items to search */
  categories: MenuCategory[];
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

// Hardcoded popular item slugs for no-results fallback
const POPULAR_ITEM_SLUGS = [
  "mohinga",
  "tea-leaf-salad",
  "shan-noodles",
  "samosa",
];

/**
 * Linear-style command palette for menu item search
 *
 * Features:
 * - Fuse.js fuzzy matching with rich result cards
 * - Category tabs for filtering results by category
 * - Match highlighting with amber/yellow accents
 * - Skeleton loading states
 * - Staggered fade-in + tab crossfade animations
 * - cmdk keyboard navigation
 * - Recent searches with individual deletion
 * - Order history search for authenticated users
 * - Enhanced no-results with popular fallback
 */
export function CommandPalette({
  open,
  onOpenChange,
  categories,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const { recentSearches, addSearch, removeSearch, clearSearches } =
    useRecentSearches();
  const { search, enrichedItems } = useFuzzySearch(categories);
  const { user } = useAuth();
  const orderHistoryResults = useOrderHistorySearch(query, user?.id);

  // Reset active tab when query changes
  useEffect(() => {
    setActiveTab(null);
  }, [query]);

  // Brief skeleton flash on query change (Fuse.js is instant on ~78 items)
  useEffect(() => {
    if (query.trim()) {
      setIsSearching(true);
      const timer = setTimeout(() => setIsSearching(false), 80);
      return () => clearTimeout(timer);
    }
    setIsSearching(false);
  }, [query]);

  // Fuzzy search results
  const fuseResults = useMemo(
    () => (query.trim() ? search(query) : []),
    [search, query]
  );

  // Derive category tabs from results
  const categoryTabs = useMemo(
    () => deriveCategoryTabs(fuseResults, categories),
    [fuseResults, categories]
  );

  // Filter results by active tab
  const displayResults = useMemo(
    () =>
      activeTab
        ? fuseResults.filter((r) => r.item._categorySlug === activeTab)
        : fuseResults,
    [fuseResults, activeTab]
  );

  // Popular items for no-results fallback
  const popularFallbackItems = useMemo((): MenuItem[] => {
    // Tag-based first
    const tagged = enrichedItems.filter((item) =>
      item.tags?.includes("popular")
    );
    if (tagged.length > 0) return tagged.slice(0, 4);

    // Slug-based fallback
    const slugBased = POPULAR_ITEM_SLUGS.map((slug) =>
      enrichedItems.find((item) => item.slug === slug)
    ).filter((item): item is EnrichedMenuItem => Boolean(item));
    if (slugBased.length > 0) return slugBased;

    // First 4 items
    return enrichedItems.slice(0, 4);
  }, [enrichedItems]);

  // Determine if we have any results at all
  const hasMenuResults = fuseResults.length > 0;
  const hasOrderResults = orderHistoryResults.length > 0;
  const hasAnyResults = hasMenuResults || hasOrderResults;

  // Handle item selection - open ItemDetailSheet overlay (palette stays open, query preserved)
  const handleSelectItem = useCallback(
    (item: MenuItem | EnrichedMenuItem) => {
      addSearch(item.nameEn);
      setSelectedItem(item as MenuItem);
    },
    [addSearch]
  );

  // Close item detail sheet - returns to search with query intact
  const handleCloseItemDetail = useCallback(() => {
    setSelectedItem(null);
  }, []);

  // Add to cart from item detail sheet
  const handleAddToCart = useCallback(
    (
      item: MenuItem,
      modifiers: SelectedModifier[],
      quantity: number,
      notes: string
    ) => {
      useCartStore.getState().addItem({
        menuItemId: item.id,
        menuItemSlug: item.slug,
        nameEn: item.nameEn,
        nameMy: item.nameMy,
        basePriceCents: item.basePriceCents,
        imageUrl: item.imageUrl,
        quantity,
        modifiers: modifiers.map((mod) => ({
          groupId: mod.groupId,
          groupName: mod.groupName,
          optionId: mod.optionId,
          optionName: mod.optionName,
          priceDeltaCents: mod.priceDeltaCents,
        })),
        notes,
      });
      // Close item sheet after adding, palette stays open for continued browsing
      setSelectedItem(null);
    },
    []
  );

  // Handle recent search selection - fills input and runs search immediately
  const handleSelectRecent = useCallback((term: string) => {
    setQuery(term);
  }, []);

  // Handle order history item selection - fill search with item name
  const handleSelectOrderItem = useCallback((nameSnapshot: string) => {
    setQuery(nameSnapshot);
  }, []);

  // Handle clear search input
  const handleClear = useCallback(() => {
    setQuery("");
  }, []);

  // Handle dialog close - clear all state including item detail
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setQuery("");
        setActiveTab(null);
        setSelectedItem(null);
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
          <m.div
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
          <m.div
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
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  handleOpenChange(false);
                }
              }}
            >
              {/* Search Input with clear button */}
              <SearchInput
                placeholder="Search menu items..."
                value={query}
                onValueChange={setQuery}
                onClear={handleClear}
                autoFocus
              />

              {/* Category tabs -- only when query has results */}
              {query.trim() && hasMenuResults && !isSearching && (
                <SearchCategoryTabs
                  tabs={categoryTabs}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                />
              )}

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
                    onRemoveRecent={removeSearch}
                    onClearRecent={clearSearches}
                    popularItems={enrichedItems}
                    onSelectItem={handleSelectItem}
                  />
                )}

                {/* Skeleton loading while searching */}
                {query.trim() && isSearching && <SearchSkeleton count={4} />}

                {/* Search results with crossfade on tab switch */}
                {query.trim() && !isSearching && hasMenuResults && (
                  <AnimatePresence mode="wait">
                    <m.div
                      key={activeTab ?? "all"}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                    >
                      <SearchResults
                        results={displayResults}
                        onSelect={handleSelectItem}
                      />
                    </m.div>
                  </AnimatePresence>
                )}

                {/* Order history results below menu results */}
                {query.trim() && !isSearching && hasOrderResults && (
                  <SearchOrderHistory
                    results={orderHistoryResults}
                    onSelectItem={handleSelectOrderItem}
                  />
                )}

                {/* Enhanced no-results state with popular items fallback */}
                {query.trim() && !isSearching && !hasAnyResults && (
                  <NoResultsState
                    query={query}
                    popularItems={popularFallbackItems}
                    onSelectItem={handleSelectItem}
                  />
                )}
              </Command.List>
            </Command>
          </m.div>

          {/* Item Detail Sheet - renders on top of search palette via Portal */}
          <ItemDetailSheet
            item={selectedItem}
            isOpen={!!selectedItem}
            onClose={handleCloseItemDetail}
            onAddToCart={handleAddToCart}
          />
        </>
      )}
    </AnimatePresence>
  );
}

export default CommandPalette;
