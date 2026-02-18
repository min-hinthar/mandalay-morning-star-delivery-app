"use client";

/**
 * MenuContent Component
 * Complete menu page composition integrating all menu components
 *
 * Features:
 * - Uses useMenu hook for data fetching
 * - Uses useFavorites hook for favorite state
 * - Composes: CategoryTabs, MenuSection, MenuGrid, ItemDetailSheet
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
import { useCustomerOfflineSync } from "@/lib/hooks/useCustomerOfflineSync";
import { menuCache } from "@/lib/services/customer-offline-store";
import { cn } from "@/lib/utils/cn";
import type { MenuItem, MenuCategory, MenuResponse } from "@/types/menu";
import type { SelectedModifier } from "@/lib/utils/price";

import { AnimatedSection, itemVariants } from "@/components/ui/scroll";
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
}

// ============================================
// MAIN COMPONENT
// ============================================

export function MenuContent({ className }: MenuContentProps) {
  // ============================================
  // ROUTING
  // ============================================
  const searchParams = useSearchParams();
  const router = useRouter();

  // ============================================
  // OFFLINE STATE
  // ============================================
  const { isOnline } = useCustomerOfflineSync();
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [usingCachedData, setUsingCachedData] = useState(false);

  // ============================================
  // DATA FETCHING
  // ============================================

  const { data, isLoading, error, refetch } = useMenu();
  const categories = useMemo(() => data?.data?.categories ?? [], [data?.data?.categories]);

  // ============================================
  // OFFLINE CACHING
  // ============================================

  // Save menu data to cache when successfully fetched
  useEffect(() => {
    if (data?.data?.categories && data.data.categories.length > 0) {
      menuCache.save(data).catch((err) => {
        console.error("[MenuContent] Failed to cache menu:", err);
      });
      // Clear cached data indicator when we have fresh data
      setUsingCachedData(false);
      setCachedAt(null);
    }
  }, [data]);

  // Load from cache on error (offline fallback)
  useEffect(() => {
    if (error && !isLoading) {
      menuCache
        .get()
        .then((cached) => {
          if (cached) {
            setCachedAt(cached.cachedAt);
            setUsingCachedData(true);
          }
        })
        .catch((err) => {
          console.error("[MenuContent] Failed to load cached menu:", err);
        });
    }
  }, [error, isLoading]);

  // Get cached categories when using offline data
  const [cachedCategories, setCachedCategories] = useState<MenuCategory[]>([]);

  useEffect(() => {
    if (usingCachedData) {
      menuCache
        .get()
        .then((cached) => {
          if (cached?.data) {
            const menuResponse = cached.data as MenuResponse;
            setCachedCategories(menuResponse.data?.categories ?? []);
          }
        })
        .catch((err) => {
          console.error("[MenuContent] Failed to read cached categories:", err);
        });
    }
  }, [usingCachedData]);

  // Use cached categories when offline, otherwise use fresh data
  const displayCategories = usingCachedData ? cachedCategories : categories;

  // ============================================
  // FAVORITES
  // ============================================

  const { favorites, toggleFavorite } = useFavorites();
  const { addItem } = useCart();

  // Create favorites Set for quick lookup
  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  // Memoize category tabs data transformation
  const tabCategories = useMemo(
    () =>
      displayCategories.map((cat: MenuCategory) => ({
        slug: cat.slug,
        name: cat.name,
        nameEn: cat.name,
      })),
    [displayCategories]
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
      // Find the item across all categories
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
        modifiers: modifiers.map((m) => ({
          groupId: m.groupId,
          groupName: m.groupName,
          optionId: m.optionId,
          optionName: m.optionName,
          priceDeltaCents: m.priceDeltaCents,
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
        <div className="text-4xl mb-4">:(</div>
        <h2 className="text-lg font-semibold text-text-primary mb-2">Failed to load menu</h2>
        <p className="text-text-muted mb-4 max-w-sm">
          We couldn&apos;t load the menu right now. Please check your connection and try again.
        </p>
        <button
          onClick={handleRetry}
          className={cn(
            "px-6 py-2.5 rounded-full",
            "bg-primary text-text-inverse font-medium",
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
  // EMPTY STATE
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
        <div className="text-4xl mb-4">:(</div>
        <h2 className="text-lg font-semibold text-text-primary mb-2">Menu Coming Soon</h2>
        <p className="text-text-muted max-w-sm">
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
      {/* Category Tabs */}
      <CategoryTabs categories={tabCategories} />

      {/* Stale Badge - shown above menu grid when offline with cached data */}
      {showStaleBadge && (
        <div className="px-4 pt-2 pb-1">
          <StaleBadge cachedAt={cachedAt} />
        </div>
      )}

      {/* Menu Sections with scroll-triggered animations */}
      <div className="space-y-8 px-4 pb-8 pt-2">
        {displayCategories.map((category: MenuCategory) => (
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
