"use client";

import Link from "next/link";
import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { spring } from "@/lib/motion-tokens";
import { UnifiedMenuItemCard, MenuCardWrapper } from "@/components/ui/menu";
import { DynamicIcon } from "@/components/ui/icons/DynamicIcon";
import { SectionCarousel } from "./SectionCarousel";
import type { FeaturedSectionWithItems } from "@/types/featured-sections";
import type { MenuItem } from "@/types/menu";

// ============================================
// TYPES
// ============================================

export interface FeaturedSectionsProps {
  /** Featured sections with their menu items */
  sections: FeaturedSectionWithItems[];
  /** Callback when item is selected */
  onItemSelect?: (item: MenuItem) => void;
  /** Set of favorite item IDs for quick lookup */
  favorites?: Set<string>;
  /** Callback for favorite toggle */
  onFavoriteToggle?: (item: MenuItem, isFavorite: boolean) => void;
  /** Additional className */
  className?: string;
}

// ============================================
// SECTION GRID COMPONENT (for first section)
// ============================================

interface SectionGridProps {
  items: MenuItem[];
  onItemSelect?: (item: MenuItem) => void;
  favorites: Set<string>;
  onFavoriteToggle?: (item: MenuItem, isFavorite: boolean) => void;
}

function SectionGrid({
  items,
  onItemSelect,
  favorites,
  onFavoriteToggle,
}: SectionGridProps) {
  return (
    <div className="px-4 md:px-6">
      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {items.map((item, index) => (
          <MenuCardWrapper
            key={item.id}
            itemId={item.id}
            index={index}
            animateMode="viewport"
          >
            <UnifiedMenuItemCard
              item={item}
              variant="menu"
              onSelect={onItemSelect}
              isFavorite={favorites.has(item.id)}
              onFavoriteToggle={onFavoriteToggle}
              priority={index < 6}
            />
          </MenuCardWrapper>
        ))}
      </div>
    </div>
  );
}

// ============================================
// SECTION HEADER COMPONENT
// ============================================

interface SectionHeaderProps {
  section: FeaturedSectionWithItems;
}

function SectionHeader({ section }: SectionHeaderProps) {
  // Use primary color as default for better light theme contrast (yellow doesn't contrast well)
  const accentColor = section.accentColor || "var(--color-primary)";
  // Background with 15% opacity of accent color, fallback to primary-light
  const bgColor = section.accentColor ? `${section.accentColor}15` : "var(--color-primary-light)";

  return (
    <div className="flex items-center gap-3 mb-6 px-4 md:px-6 flex-wrap">
      {/* Icon badge + name */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full"
        style={{ backgroundColor: bgColor }}
      >
        <DynamicIcon
          name={section.icon}
          className="w-4 h-4"
          style={{ color: accentColor }}
        />
        <span
          className="text-sm font-body font-semibold"
          style={{ color: accentColor }}
        >
          {section.name}
        </span>
      </div>

      {/* Subtitle */}
      {section.subtitle && (
        <p className="text-sm font-body text-text-muted hidden sm:block">
          {section.subtitle}
        </p>
      )}

      {/* View All link */}
      <Link
        href={`/menu?section=${section.slug}`}
        className={cn(
          "ml-auto flex items-center gap-1",
          "text-sm font-body font-medium",
          "text-text-muted hover:text-primary",
          "transition-colors duration-fast"
        )}
      >
        View All
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * Container for all featured sections on homepage.
 * First section displays as grid, others as horizontal carousels.
 * Each section has icon badge, optional subtitle, and "View All" link.
 */
export function FeaturedSections({
  sections,
  onItemSelect,
  favorites = new Set(),
  onFavoriteToggle,
  className,
}: FeaturedSectionsProps) {
  const { shouldAnimate } = useAnimationPreference();

  if (sections.length === 0) return null;

  return (
    <div className={cn("space-y-12 md:space-y-16", className)}>
      {sections.map((section, index) => (
        <m.div
          key={section.id}
          id={`featured-${section.slug}`}
          initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
          whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          viewport={{ once: true, margin: "-80px" }}
          transition={spring.gentle}
        >
          {/* Section Header */}
          <SectionHeader section={section} />

          {/* First section: Grid layout, others: Carousel */}
          {index === 0 ? (
            <SectionGrid
              items={section.items}
              onItemSelect={onItemSelect}
              favorites={favorites}
              onFavoriteToggle={onFavoriteToggle}
            />
          ) : (
            <SectionCarousel
              items={section.items}
              onItemSelect={onItemSelect}
              favorites={favorites}
              onFavoriteToggle={onFavoriteToggle}
              accentColor={section.accentColor}
            />
          )}
        </m.div>
      ))}
    </div>
  );
}

export default FeaturedSections;
