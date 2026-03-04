"use client";

/**
 * MenuContent Component
 * Complete menu page composition integrating all menu components
 *
 * Features:
 * - Uses useMenu hook for data fetching
 * - Uses useFavorites hook for favorite state
 * - Uses useMenuFilters for text search, dietary filters, and sold-out sorting
 * - Composes: MenuHeader, CategoryTabs, MenuSection, MenuGrid, ItemDetailSheet
 * - Shows MenuSkeleton while loading
 * - Error state with retry button
 * - Opens item modal from URL param (?item=slug) for command palette integration
 * - Offline support: caches menu data and shows stale badge when offline
 *
 * @example
 * <MenuContent className="min-h-screen" />
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { m } from "framer-motion";
import { useMenu } from "@/lib/hooks/useMenu";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { useCart } from "@/lib/hooks/useCart";
import { useMenuFilters } from "@/lib/hooks/useMenuFilters";
import { useCustomerOfflineSync } from "@/lib/hooks/useCustomerOfflineSync";
import { cn } from "@/lib/utils/cn";
import type { MenuItem, MenuCategory } from "@/types/menu";
import { useMenuCache } from "./useMenuCache";
import type { SelectedModifier } from "@/lib/utils/price";

import { AnimatedSection, itemVariants } from "@/components/ui/scroll";
import { DeliveryBanner } from "@/components/ui/delivery";
import { MenuHeader } from "./MenuHeader";
import { CategoryTabs } from "./CategoryTabs";
import { MenuSection } from "./MenuSection";
import { MenuGrid } from "./MenuGrid";
import { ItemDetailSheet } from "./ItemDetailSheet";
import { MenuSkeleton } from "./MenuSkeleton";
import { StaleBadge } from "@/components/ui/offline";

// ============================================
// TYPES
// ============================================

export interface MenuContentProps {
  /** Additional className */
  className?: string;
  /** Cutoff day of week (0=Sun..6=Sat). Defaults to Friday (5). */
  cutoffDay?: number;
  /** Cutoff hour (0-23). Defaults to 15 (3 PM). */
  cutoffHour?: number;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function MenuContent({ className, cutoffDay, cutoffHour }: MenuContentProps) {
  // ============================================
  // ROUTING
  // ============================================
  const searchParams = useSearchParams();
  const router = useRouter();

  // ============================================
  // OFFLINE STATE
  // ============================================
  const { isOnline } = useCustomerOfflineSync();

  // ============================================
  // DATA FETCHING
  // ============================================

  const { data, isLoading, error, refetch } = useMenu();
  const categories = useMemo(() => data?.data?.categories ?? [], [data?.data?.categories]);

  // ============================================
  // OFFLINE CACHING
  // ============================================

  const { displayCategories, cachedAt, usingCachedData } = useMenuCache({
    data,
    categories,
    error,
    isLoading,
  });

  // ============================================
  // FILTERING
  // ============================================

  const {
    setQuery,
    dietaryFilters,
    setDietaryFilters,
    hasActiveFilters,
    clearFilters,
    filterItems,
  } = useMenuFilters();

  // Apply text + dietary + sold-out filtering
  const filteredCategories = useMemo(
    () => filterItems(displayCategories),
    [filterItems, displayCategories]
  );

  // ============================================
  // FAVORITES
  // ============================================

  const { favorites, toggleFavorite } = useFavorites();
  const { addItem } = useCart();

  // Create favorites Set for quick lookup
  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  // Memoize category tabs data transformation (use filtered categories)
  const tabCategories = useMemo(
    () =>
      filteredCategories.map((cat: MenuCategory) => ({
        slug: cat.slug,
        name: cat.name,
        nameEn: cat.name,
      })),
    [filteredCategories]
  );

  // ============================================
  // ITEM DETAIL STATE
  // ============================================

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Timeout ref for cleanup
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // ============================================
  // HANDLERS
  // ============================================

  const handleSelectItem = useCallback((item: MenuItem) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
    // Clear any pending timeout
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    // Delay clearing item to allow close animation to complete
    closeTimeoutRef.current = setTimeout(() => setSelectedItem(null), 300);
  }, []);

  // Handle URL param to open item modal (from command palette search)
  // Uses useSearchParams to react to client-side navigation
  useEffect(() => {
    if (displayCategories.length === 0) return;

    const itemSlug = searchParams.get("item");

    if (itemSlug) {
      // Find the item across all categories (search unfiltered to find any item)
      const item = displayCategories
        .flatMap((c: MenuCategory) => c.items ?? [])
        .find((i: MenuItem) => i.slug === itemSlug);

      if (item) {
        setSelectedItem(item);
        setIsDetailOpen(true);
        // Clear the URL param to avoid reopening on refresh
        router.replace("/menu", { scroll: false });
      }
    }
  }, [displayCategories, searchParams, router]);

  const handleFavoriteToggle = useCallback(
    (itemId: string) => {
      toggleFavorite(itemId);
    },
    [toggleFavorite]
  );

  const handleAddToCart = useCallback(
    (item: MenuItem, modifiers: SelectedModifier[], quantity: number, notes: string) => {
      addItem({
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
    },
    [addItem]
  );

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    return <MenuSkeleton className={className} />;
  }

  // ============================================
  // ERROR STATE (only show if no cached data available)
  // ============================================

  if (error && !usingCachedData) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center p-8 text-center",
          "min-h-[400px]",
          className
        )}
      >
        <div className="mb-4 text-4xl">:(</div>
        <h2 className="mb-2 text-lg font-semibold text-text-primary">Failed to load menu</h2>
        <p className="mb-4 max-w-sm text-text-muted">
          We couldn&apos;t load the menu right now. Please check your connection and try again.
        </p>
        <button
          onClick={handleRetry}
          className={cn(
            "rounded-full px-6 py-2.5",
            "bg-primary font-medium text-text-inverse",
            "hover:bg-primary/90 active:scale-95",
            "transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          )}
        >
          Try Again
        </button>
      </div>
    );
  }

  // ============================================
  // EMPTY STATE (no data at all)
  // ============================================

  if (displayCategories.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center p-8 text-center",
          "min-h-[400px]",
          className
        )}
      >
        <div className="mb-4 text-4xl">:(</div>
        <h2 className="mb-2 text-lg font-semibold text-text-primary">Menu Coming Soon</h2>
        <p className="max-w-sm text-text-muted">
          Our menu is being prepared. Check back soon for delicious Burmese cuisine!
        </p>
      </div>
    );
  }

  // Show stale badge when offline with cached data
  const showStaleBadge = !isOnline && cachedAt;

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className={cn("relative", className)}>
      {/* Menu Header: always-visible search + collapsible dietary chips */}
      <MenuHeader
        onQueryChange={setQuery}
        onSelectItem={handleSelectItem}
        dietaryFilters={dietaryFilters}
        onDietaryChange={setDietaryFilters}
      />

      {/* Delivery Banner */}
      <DeliveryBanner cutoffDay={cutoffDay ?? 5} cutoffHour={cutoffHour ?? 15} />

      {/* Category Tabs */}
      <CategoryTabs categories={tabCategories} />

      {/* Stale Badge - shown above menu grid when offline with cached data */}
      {showStaleBadge && (
        <div className="px-4 pb-1 pt-2">
          <StaleBadge cachedAt={cachedAt} />
        </div>
      )}

      {/* No results empty state (filters active but nothing matches) */}
      {hasActiveFilters && filteredCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[200px]">
          <div className="mb-3 text-3xl">:/</div>
          <h2 className="mb-1 text-lg font-semibold text-text-primary">
            No items match your filters
          </h2>
          <p className="mb-4 max-w-xs text-sm text-text-muted">
            Try adjusting your search or dietary preferences.
          </p>
          <button
            onClick={clearFilters}
            className={cn(
              "rounded-full px-5 py-2",
              "bg-primary font-medium text-text-inverse text-sm",
              "hover:bg-primary/90 active:scale-95",
              "transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            )}
          >
            Clear filters
          </button>
        </div>
      ) : (
        /* Menu Sections with scroll-triggered animations */
        <div className="space-y-8 px-4 pb-8 pt-2">
          {filteredCategories.map((category: MenuCategory) => (
            <AnimatedSection key={category.slug} as="div">
              <m.div variants={itemVariants}>
                <MenuSection
                  category={{
                    slug: category.slug,
                    name: category.name,
                    nameEn: category.name,
                  }}
                >
                  <MenuGrid
                    items={category.items ?? []}
                    categorySlug={category.slug}
                    onSelectItem={handleSelectItem}
                    onFavoriteToggle={handleFavoriteToggle}
                    favorites={favoritesSet}
                  />
                </MenuSection>
              </m.div>
            </AnimatedSection>
          ))}
        </div>
      )}

      {/* Item Detail Sheet */}
      <ItemDetailSheet
        item={selectedItem}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}

export default MenuContent;
