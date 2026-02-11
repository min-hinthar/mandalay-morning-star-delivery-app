import { Skeleton } from "@/components/ui/skeleton";

// ============================================
// ORDERS PAGE SKELETON
// ============================================

/**
 * Skeleton placeholder matching the orders page layout.
 * Uses shimmer variant (default) -- no animate-pulse.
 */
export function OrdersPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header area */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton width={160} height={36} radius="lg" />
          <Skeleton width={48} height={28} radius="full" />
        </div>
        <Skeleton width={100} height={36} radius="lg" />
      </div>

      {/* Filter pills bar */}
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} width={100} height={28} radius="full" />
        ))}
      </div>

      {/* Card rows */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={72} radius="xl" />
        ))}
      </div>
    </div>
  );
}
