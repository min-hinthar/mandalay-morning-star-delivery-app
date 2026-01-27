"use client";

/**
 * MenuGrid Component
 * Responsive grid container using UnifiedMenuItemCard with 3D tilt
 *
 * Features:
 * - Uses UnifiedMenuItemCard with glassmorphism and 3D tilt
 * - MenuCardWrapper for consistent glow and animation
 * - Responsive grid: 1 col mobile, 2 sm, 3 lg
 * - Animations replay on scroll re-enter
 *
 * @example
 * <MenuGrid
 *   items={menuItems}
 *   categorySlug="appetizers"
 *   onSelectItem={(item) => openDetail(item)}
 *   favorites={favoritesSet}
 * />
 */

import { cn } from "@/lib/utils/cn";
import { UnifiedMenuItemCard } from "@/components/menu/UnifiedMenuItemCard";
import { MenuCardWrapper } from "@/components/menu/MenuCardWrapper";
import type { MenuItem } from "@/types/menu";

// ============================================
// TYPES
// ============================================

export interface MenuGridProps {
  /** Menu items to display */
  items: MenuItem[];
  /** Category slug for emoji placeholder fallback */
  categorySlug?: string;
  /** Callback when item is selected */
  onSelectItem: (item: MenuItem) => void;
  /** Callback when favorite is toggled */
  onFavoriteToggle?: (itemId: string, isFavorite: boolean) => void;
  /** Set of favorite item IDs for quick lookup */
  favorites?: Set<string>;
  /** Additional className */
  className?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function MenuGrid({
  items,
  categorySlug,
  onSelectItem,
  onFavoriteToggle,
  favorites = new Set(),
  className,
}: MenuGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        // Responsive: 1 col mobile, 2 cols tablet, 3 cols desktop
        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {items.map((item, index) => (
        <MenuCardWrapper
          key={item.id}
          itemId={item.id}
          index={index}
          replayOnScroll={true}
        >
          <UnifiedMenuItemCard
            item={item}
            variant="menu"
            categorySlug={categorySlug}
            onSelect={onSelectItem}
            isFavorite={favorites.has(item.id)}
            onFavoriteToggle={
              onFavoriteToggle
                ? (menuItem, isFav) => onFavoriteToggle(menuItem.id, isFav)
                : undefined
            }
            priority={index < 4}
          />
        </MenuCardWrapper>
      ))}
    </div>
  );
}

export default MenuGrid;
