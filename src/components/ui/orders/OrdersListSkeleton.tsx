import { Skeleton } from "@/components/ui/skeleton";
import { OrderCardSkeleton } from "@/components/ui/account/OrdersTab/OrderCardSkeleton";

interface OrdersListSkeletonProps {
  count?: number;
}

export function OrdersListSkeleton({ count = 3 }: OrdersListSkeletonProps) {
  return (
    <div aria-hidden="true">
      <main className="min-h-screen bg-gradient-to-b from-surface-secondary to-surface-primary pt-8 pb-32 px-4">
        <div className="mx-auto max-w-2xl">
          {/* Header skeleton matching OrdersHeader layout */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Skeleton width={44} height={44} radius="full" />
              <Skeleton height={28} width="40%" radius="sm" />
            </div>
            <Skeleton height={36} width={100} radius="lg" />
          </div>
          {/* Order cards with stagger */}
          <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className={`stagger-${Math.min(i + 1, 8)}`}>
                <OrderCardSkeleton />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
