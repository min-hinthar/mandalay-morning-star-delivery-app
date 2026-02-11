"use client";

import { cn } from "@/lib/utils/cn";

export interface SearchSkeletonProps {
  /** Number of skeleton cards to render (default: 5) */
  count?: number;
}

/**
 * Skeleton loading placeholder mimicking SearchResultCard layout.
 *
 * Shows pulsing 64px thumbnail squares, text lines for name/category/price,
 * and small badge placeholders. Matches the rich card layout precisely
 * so there's no layout shift when real results appear.
 */
export function SearchSkeleton({ count = 5 }: SearchSkeletonProps) {
  return (
    <div className="py-1" role="status" aria-label="Loading search results">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 px-3 py-2.5"
          style={{
            // Staggered opacity for visual depth
            opacity: 1 - i * 0.08,
          }}
        >
          {/* Thumbnail skeleton */}
          <div
            className={cn(
              "w-16 h-16 flex-shrink-0 rounded-xl",
              "bg-surface-secondary animate-pulse"
            )}
          />

          {/* Content skeleton */}
          <div className="flex-1 min-w-0 py-0.5 space-y-2">
            {/* Name line */}
            <div
              className="h-4 rounded-md bg-surface-secondary animate-pulse"
              style={{ width: `${55 + (i % 3) * 12}%` }}
            />

            {/* Category badge */}
            <div className="h-3 w-20 rounded-full bg-surface-secondary/60 animate-pulse" />

            {/* Tag pills row */}
            <div className="flex gap-1.5">
              <div className="h-3 w-14 rounded-full bg-surface-secondary/40 animate-pulse" />
              {i % 2 === 0 && (
                <div className="h-3 w-10 rounded-full bg-surface-secondary/40 animate-pulse" />
              )}
            </div>
          </div>

          {/* Price skeleton */}
          <div className="flex-shrink-0 py-0.5">
            <div className="h-4 w-12 rounded-md bg-surface-secondary animate-pulse" />
          </div>
        </div>
      ))}

      <span className="sr-only">Loading search results...</span>
    </div>
  );
}

export default SearchSkeleton;
