"use client";

import { Skeleton } from "@/components/ui/skeleton/base";

/**
 * Shimmer skeleton for driver history page.
 * Matches layout: 3 stat cards across top, 5 summary card shapes below.
 */
export function HistorySkeleton() {
  return (
    <div className="p-4 space-y-6">
      {/* Stats skeleton -- 3 across */}
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl bg-surface-primary p-3 shadow-sm border border-border space-y-2"
          >
            <Skeleton width={40} height={28} radius="md" variant="shimmer" />
            <Skeleton width={60} height={14} radius="md" variant="shimmer" />
          </div>
        ))}
      </div>

      {/* Section header skeleton */}
      <Skeleton width={120} height={22} radius="md" variant="shimmer" />

      {/* Summary card skeletons */}
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl bg-surface-primary p-4 shadow-sm border border-border space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton width={140} height={18} radius="md" variant="shimmer" />
              <Skeleton width={20} height={20} radius="md" variant="shimmer" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton width={70} height={14} radius="md" variant="shimmer" />
              <Skeleton width={60} height={14} radius="md" variant="shimmer" />
              <Skeleton width={50} height={14} radius="md" variant="shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
