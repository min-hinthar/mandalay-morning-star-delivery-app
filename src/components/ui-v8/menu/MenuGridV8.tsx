"use client";

/**
 * MenuGridV8 Component
 * Responsive grid container using UnifiedMenuItemCard with 3D tilt
 *
 * Features:
 * - Uses UnifiedMenuItemCard with glassmorphism and 3D tilt
 * - Framer Motion staggered scroll-reveal animation
 * - Responsive grid: 1 col mobile, 2 sm, 3 lg (per CONTEXT.md)
 * - Plays once (no reverse on scroll back)
 *
 * @example
 * <MenuGridV8
 *   items={menuItems}
 *   categorySlug="appetizers"
 *   onSelectItem={(item) => openDetail(item)}
 *   favorites={favoritesSet}
 * />
 */

import { useRef } from "react";
import { motion } from "framer-motion";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { cn } from "@/lib/utils/cn";
import { UnifiedMenuItemCard } from "@/components/menu/UnifiedMenuItemCard";
import type { MenuItem } from "@/types/menu";

// ============================================
// TYPES
// ============================================

export interface MenuGridV8Props {
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

export function MenuGridV8({
  items,
  categorySlug,
  onSelectItem,
  onFavoriteToggle,
  favorites = new Set(),
  className,
}: MenuGridV8Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { shouldAnimate } = useAnimationPreference();

  return (
    <div
      ref={containerRef}
      className={cn(
        "grid gap-4",
        // Responsive: 1 col mobile, 2 cols tablet, 3 cols desktop (per CONTEXT.md)
        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          data-menu-card={item.id}
          initial={shouldAnimate ? { opacity: 0, y: 18 } : undefined}
          whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          viewport={{ once: true, margin: "-50px" }}
          transition={{
            delay: Math.min(index * 0.08, 0.64),
            duration: 0.55,
          }}
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
            // Priority load first 4 items (above fold)
            priority={index < 4}
          />
        </motion.div>
      ))}
    </div>
  );
}

export default MenuGridV8;
