"use client";

/**
 * MenuContentV8 Component
 * Complete menu page composition integrating all V8 menu components
 *
 * Features:
 * - Uses useMenu hook for data fetching
 * - Uses useFavorites hook for favorite state
 * - Composes: SearchInputV8, CategoryTabsV8, MenuSectionV8, MenuGridV8, ItemDetailSheetV8
 * - Shows MenuSkeletonV8 while loading
 * - Error state with retry button
 *
 * @example
 * <MenuContentV8 className="min-h-screen" />
 */

import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useMenu } from "@/lib/hooks/useMenu";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { useCart } from "@/lib/hooks/useCart";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import type { MenuItem, MenuCategory } from "@/types/menu";
import type { SelectedModifier } from "@/lib/utils/price";

import { AnimatedSection, itemVariants } from "@/components/scroll/AnimatedSection";
import { CategoryTabsV8 } from "./CategoryTabsV8";
import { MenuSectionV8 } from "./MenuSectionV8";
import { MenuGridV8 } from "./MenuGridV8";
import { SearchInputV8 } from "./SearchInputV8";
import { ItemDetailSheetV8 } from "./ItemDetailSheetV8";
import { MenuSkeletonV8 } from "./MenuSkeletonV8";

// ============================================
// TYPES
// ============================================

export interface MenuContentV8Props {
  /** Additional className */
  className?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function MenuContentV8({ className }: MenuContentV8Props) {
  // ============================================
  // ANIMATION
  // ============================================

  const { shouldAnimate, getSpring } = useAnimationPreference();

  // ============================================
  // DATA FETCHING
  // ============================================

  const { data, isLoading, error, refetch } = useMenu();
  const categories = data?.data?.categories ?? [];

  // ============================================
  // FAVORITES
  // ============================================

  const { favorites, toggleFavorite } = useFavorites();
  const { addItem } = useCart();

  // Create favorites Set for quick lookup
  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  // ============================================
  // ITEM DETAIL STATE
  // ============================================

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // ============================================
  // HANDLERS
  // ============================================

  const handleSelectItem = useCallback((item: MenuItem) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
    // Delay clearing item to allow close animation to complete
    setTimeout(() => setSelectedItem(null), 300);
  }, []);

  const handleFavoriteToggle = useCallback(
    (itemId: string) => {
      toggleFavorite(itemId);
    },
    [toggleFavorite]
  );

  const handleAddToCart = useCallback(
    (
      item: MenuItem,
      modifiers: SelectedModifier[],
      quantity: number,
      notes: string
    ) => {
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
    return <MenuSkeletonV8 className={className} />;
  }

  // ============================================
  // ERROR STATE
  // ============================================

  if (error) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center p-8 text-center",
          "min-h-[400px]",
          className
        )}
      >
        <div className="text-4xl mb-4">😕</div>
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          Failed to load menu
        </h2>
        <p className="text-text-muted mb-4 max-w-sm">
          We couldn&apos;t load the menu right now. Please check your connection and try again.
        </p>
        <button
          onClick={handleRetry}
          className={cn(
            "px-6 py-2.5 rounded-full",
            "bg-primary text-white font-medium",
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

  if (categories.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center p-8 text-center",
          "min-h-[400px]",
          className
        )}
      >
        <div className="text-4xl mb-4">🍽️</div>
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          Menu Coming Soon
        </h2>
        <p className="text-text-muted max-w-sm">
          Our menu is being prepared. Check back soon for delicious Burmese cuisine!
        </p>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className={cn("relative", className)}>
      {/* Search Input with entrance animation */}
      <motion.div
        className="px-4 py-3 border-b border-border-subtle"
        initial={shouldAnimate ? { opacity: 0, y: -16 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={getSpring(spring.default)}
      >
        <SearchInputV8
          onSelectItem={handleSelectItem}
          placeholder="Search dishes..."
        />
      </motion.div>

      {/* Category Tabs */}
      <CategoryTabsV8
        categories={categories.map((cat: MenuCategory) => ({
          slug: cat.slug,
          name: cat.name,
          nameEn: cat.name,
        }))}
      />

      {/* Menu Sections with scroll-triggered animations */}
      <div className="space-y-8 px-4 pb-8 pt-2">
        {categories.map((category: MenuCategory) => (
          <AnimatedSection
            key={category.slug}
            id={`category-${category.slug}`}
            as="div"
            className="scroll-mt-36"
          >
            <motion.div variants={itemVariants}>
              <MenuSectionV8
                category={{
                  slug: category.slug,
                  name: category.name,
                  nameEn: category.name,
                }}
              >
                <MenuGridV8
                  items={category.items ?? []}
                  categorySlug={category.slug}
                  onSelectItem={handleSelectItem}
                  onFavoriteToggle={handleFavoriteToggle}
                  favorites={favoritesSet}
                />
              </MenuSectionV8>
            </motion.div>
          </AnimatedSection>
        ))}
      </div>

      {/* Item Detail Sheet */}
      <ItemDetailSheetV8
        item={selectedItem}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}

export default MenuContentV8;
