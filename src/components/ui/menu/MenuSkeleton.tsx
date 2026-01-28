"use client";

/**
 * MenuSkeleton Component
 * Loading skeleton states for menu content
 *
 * Features:
 * - Full menu skeleton with tab bar + sections
 * - Individual card skeleton component
 * - Shimmer animation for loading effect
 * - Matches exact structure of real menu for smooth transition
 *
 * @example
 * // Full menu loading state
 * <MenuSkeleton sectionsCount={3} itemsPerSection={4} />
 *
 * // Single card skeleton
 * <MenuItemCardSkeleton variant="default" />
 */

import { cn } from "@/lib/utils/cn";

// ============================================
// TYPES
// ============================================

export interface MenuSkeletonProps {
  /** Number of sections to show */
  sectionsCount?: number;
  /** Number of items per section */
  itemsPerSection?: number;
  /** Additional className */
  className?: string;
}

export interface MenuItemCardSkeletonProps {
  /** Card variant matching MenuItemCardV8 */
  variant?: "default" | "compact" | "featured";
  /** Additional className */
  className?: string;
}

// ============================================
// CARD SKELETON VARIANT CONFIGS
// ============================================

const variantConfig = {
  default: {
    card: "w-full",
    imageContainer: "aspect-[16/9]",
    content: "p-3 sm:p-4",
  },
  compact: {
    card: "w-full",
    imageContainer: "aspect-square",
    content: "p-2 sm:p-3",
  },
  featured: {
    card: "w-full",
    imageContainer: "aspect-[4/3]",
    content: "p-4 sm:p-5",
  },
};

// ============================================
// MENU SKELETON (Full Page)
// ============================================

export function MenuSkeleton({
  sectionsCount = 3,
  itemsPerSection = 4,
  className,
}: MenuSkeletonProps) {
  return (
    <div className={className}>
      {/* Category tabs skeleton */}
      <div className="sticky top-[var(--tabs-offset)] z-20 border-b border-border bg-surface-primary/95 backdrop-blur-lg">
        <div className="flex gap-2 overflow-hidden px-4 py-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-10 flex-shrink-0 rounded-full",
                "bg-surface-tertiary animate-shimmer",
                // Vary tab widths for natural look
                i === 0 ? "w-16" : i % 2 === 0 ? "w-24" : "w-20"
              )}
            />
          ))}
        </div>
      </div>

      {/* Sections skeleton */}
      <div className="space-y-8 px-4 pb-8 pt-6">
        {Array.from({ length: sectionsCount }).map((_, sectionIdx) => (
          <section key={sectionIdx} className="space-y-4">
            {/* Section header skeleton */}
            <div
              className={cn(
                "h-7 rounded bg-surface-tertiary animate-shimmer",
                // Vary heading widths
                sectionIdx === 0 ? "w-32" : sectionIdx === 1 ? "w-40" : "w-36"
              )}
            />

            {/* Grid of card skeletons */}
            <div className="grid gap-4 grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: itemsPerSection }).map((_, cardIdx) => (
                <MenuItemCardSkeleton
                  key={cardIdx}
                  // Stagger animation delay for cascade effect
                  className={`stagger-${Math.min(cardIdx + 1, 8)}`}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

// ============================================
// CARD SKELETON (Individual)
// ============================================

export function MenuItemCardSkeleton({
  variant = "default",
  className,
}: MenuItemCardSkeletonProps) {
  const config = variantConfig[variant];

  return (
    <div
      className={cn(
        config.card,
        "bg-surface-primary rounded-xl",
        "border border-border",
        "overflow-hidden",
        className
      )}
      aria-hidden="true"
    >
      {/* Image skeleton with shimmer */}
      <div
        className={cn(
          config.imageContainer,
          "relative bg-surface-tertiary"
        )}
      >
        {/* Shimmer overlay */}
        <div className="absolute inset-0 animate-shimmer" />
      </div>

      {/* Content skeleton */}
      <div className={config.content}>
        {/* Title row: name + price */}
        <div className="flex items-start justify-between gap-2">
          <div className="h-5 w-3/4 rounded bg-surface-tertiary animate-shimmer" />
          <div className="h-5 w-14 flex-shrink-0 rounded bg-surface-tertiary animate-shimmer" />
        </div>

        {/* Description lines */}
        <div className="mt-2 space-y-2">
          <div className="h-4 w-full rounded bg-surface-tertiary animate-shimmer" />
          <div className="h-4 w-2/3 rounded bg-surface-tertiary animate-shimmer" />
        </div>

        {/* Myanmar name */}
        <div className="mt-2 h-3 w-1/3 rounded bg-surface-tertiary animate-shimmer" />
      </div>
    </div>
  );
}

// ============================================
// SEARCH SKELETON
// ============================================

export function SearchSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-11 w-full rounded-full",
        "bg-surface-secondary border border-border",
        "animate-shimmer",
        className
      )}
    />
  );
}

export default MenuSkeleton;
