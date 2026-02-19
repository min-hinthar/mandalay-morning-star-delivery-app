import { Skeleton } from "@/components/ui/skeleton/base";

export default function EarningsLoading() {
  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton width={24} height={24} radius="md" variant="shimmer" />
        <Skeleton width={120} height={28} radius="lg" variant="shimmer" />
        <div className="flex-1" />
        <Skeleton width={80} height={24} radius="md" variant="shimmer" />
      </div>

      {/* Period toggle skeleton */}
      <div className="flex gap-1 rounded-lg border border-border bg-surface-primary p-1">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} width={80} height={32} radius="md" variant="shimmer" />
        ))}
      </div>

      {/* Chart area skeleton */}
      <div className="rounded-2xl bg-surface-primary p-4 shadow-card border border-border space-y-3">
        <Skeleton width={140} height={20} radius="md" variant="shimmer" />
        <Skeleton width="100%" height={220} radius="lg" variant="shimmer" />
      </div>

      {/* Route breakdown skeleton */}
      <div className="space-y-2">
        <Skeleton width={160} height={20} radius="md" variant="shimmer" />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-surface-primary p-4 shadow-card border border-border flex items-center justify-between"
          >
            <div className="space-y-1">
              <Skeleton width={100} height={16} radius="md" variant="shimmer" />
              <Skeleton width={60} height={14} radius="md" variant="shimmer" />
            </div>
            <Skeleton width={60} height={20} radius="md" variant="shimmer" />
          </div>
        ))}
      </div>

      {/* Badges skeleton */}
      <div className="space-y-3">
        <Skeleton width={140} height={20} radius="md" variant="shimmer" />
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Skeleton width={48} height={48} radius="full" variant="shimmer" />
              <Skeleton width={40} height={12} radius="md" variant="shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
