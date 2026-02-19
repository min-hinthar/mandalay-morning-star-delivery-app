import { Skeleton } from "@/components/ui/skeleton/base";

export default function EarningsLoading() {
  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton width={24} height={24} radius="md" variant="shimmer" />
        <Skeleton width={120} height={28} radius="lg" variant="shimmer" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-surface-primary p-4 shadow-card border border-border space-y-2"
          >
            <Skeleton width={48} height={32} radius="md" variant="shimmer" />
            <Skeleton width={80} height={16} radius="md" variant="shimmer" />
          </div>
        ))}
      </div>

      {/* Chart area skeleton */}
      <div className="rounded-2xl bg-surface-primary p-4 shadow-card border border-border space-y-3">
        <Skeleton width={140} height={20} radius="md" variant="shimmer" />
        <Skeleton width="100%" height={220} radius="lg" variant="shimmer" />
      </div>

      {/* Route list skeleton */}
      <div className="space-y-3">
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
    </div>
  );
}
