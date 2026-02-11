'use client';

import { Skeleton } from '@/components/ui/skeleton/base';

// ============================================
// ROUTES PAGE SKELETON
// ============================================

export function RoutesPageSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton width={160} height={32} radius="lg" variant="shimmer" />
          <Skeleton width={48} height={28} radius="full" variant="shimmer" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton width={100} height={36} radius="lg" variant="shimmer" />
          <Skeleton width={120} height={36} radius="lg" variant="shimmer" />
        </div>
      </div>

      {/* Stat cards skeleton - 4 columns */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={96} radius="xl" variant="shimmer" />
        ))}
      </div>

      {/* Date nav + filters skeleton */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <Skeleton width={260} height={40} radius="xl" variant="shimmer" />
        <div className="flex items-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width={80} height={28} radius="full" variant="shimmer" />
          ))}
        </div>
      </div>

      {/* Date section header skeleton */}
      <Skeleton width={120} height={20} radius="sm" variant="shimmer" />

      {/* Card row skeletons */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} height={80} radius="xl" variant="shimmer" />
        ))}
      </div>
    </div>
  );
}
