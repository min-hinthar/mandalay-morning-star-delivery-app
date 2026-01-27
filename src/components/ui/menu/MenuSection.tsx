"use client";

/**
 * MenuSection Component
 * Category section wrapper with proper ID for scrollspy targeting
 *
 * Features:
 * - Generates category-{slug} ID for CategoryTabs scrollspy
 * - Category heading with bilingual support (English + Burmese)
 * - Scroll margin for sticky header offset
 * - Accessible via aria-labelledby
 *
 * @example
 * <MenuSection category={{ slug: "appetizers", name: "Appetizers" }}>
 *   {menuItems.map((item) => <MenuItem key={item.id} {...item} />)}
 * </MenuSection>
 */

import { type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface MenuSectionCategory {
  /** URL-friendly slug for the category */
  slug: string;
  /** Display name */
  name: string;
  /** English name (optional) */
  nameEn?: string;
  /** Burmese name (optional) */
  nameMy?: string;
}

export interface MenuSectionProps {
  /** Category object with slug and names */
  category: MenuSectionCategory;
  /** Section content (menu items) */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function MenuSection({
  category,
  children,
  className,
}: MenuSectionProps) {
  const sectionId = `category-${category.slug}`;
  const headingId = `category-heading-${category.slug}`;

  return (
    <section
      id={sectionId}
      aria-labelledby={headingId}
      className={cn(
        // Scroll margin accounts for: header (72px) + tabs (~60px) + gap (8px) = 140px
        "scroll-mt-[140px]",
        className
      )}
    >
      <h2
        id={headingId}
        className="font-display text-xl font-bold text-text-primary mb-4"
      >
        {category.nameEn || category.name}
        {category.nameMy && (
          <span className="ml-2 font-burmese text-base text-text-muted">
            {category.nameMy}
          </span>
        )}
      </h2>
      {children}
    </section>
  );
}

export default MenuSection;
