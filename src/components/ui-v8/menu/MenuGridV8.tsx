"use client";

/**
 * MenuGridV8 Component
 * Responsive grid container with GSAP ScrollTrigger staggered reveal
 *
 * Features:
 * - GSAP staggered animation on scroll into view
 * - Respects user animation preference
 * - Responsive grid: 1 col mobile, 2 xs, 3 md, 4 lg
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
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { gsapDuration, gsapEase, gsapPresets } from "@/lib/gsap/presets";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { cn } from "@/lib/utils/cn";
import { MenuItemCardV8 } from "./MenuItemCardV8";
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

  useGSAP(
    () => {
      if (!shouldAnimate || !containerRef.current) return;

      // Target all cards with data-menu-card attribute
      const cards = containerRef.current.querySelectorAll("[data-menu-card]");

      if (cards.length === 0) return;

      // Staggered reveal animation
      gsap.from(cards, {
        y: 40,
        opacity: 0,
        duration: gsapDuration.slow,
        ease: gsapEase.default,
        stagger: gsapPresets.stagger.normal, // 0.06s between items
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 85%",
          // Play once, don't reverse or replay
          toggleActions: "play none none none",
        },
      });
    },
    { scope: containerRef, dependencies: [shouldAnimate, items.length] }
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "grid gap-4",
        "grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
        className
      )}
    >
      {items.map((item, index) => (
        <MenuItemCardV8
          key={item.id}
          item={item}
          categorySlug={categorySlug}
          onClick={onSelectItem}
          // Priority load first 4 items (above fold)
          priority={index < 4}
          data-menu-card={item.id}
        />
      ))}
    </div>
  );
}

export default MenuGridV8;
