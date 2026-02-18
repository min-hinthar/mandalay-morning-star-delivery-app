"use client";

import { Skeleton } from "@/components/ui/skeleton";

// ============================================
// COMPONENT
// ============================================

/**
 * DriversPageSkeleton
 *
 * Matches drivers page layout:
 * - 4 stat card skeletons across top (4-column grid)
 * - 5 card row skeletons below
 * Uses shimmer variant (no animate-pulse).
 */
export function DriversPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stat cards - 4 column grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={96} radius="xl" variant="shimmer" />
        ))}
      </div>

      {/* Card row skeletons */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={80} radius="xl" variant="shimmer" />
        ))}
      </div>
    </div>
  );
}
