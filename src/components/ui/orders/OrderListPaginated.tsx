"use client";

import { OrderListAnimated } from "./OrderListAnimated";
import type { OrderSummary } from "./OrderListAnimated";
import { OrderCardSkeleton } from "@/components/ui/account/OrdersTab/OrderCardSkeleton";
import { Button } from "@/components/ui/button";
import { useOrdersPaginated } from "@/lib/hooks/useOrdersPaginated";

interface OrderListPaginatedProps {
  initialOrders: OrderSummary[];
  initialCursor: string | null;
  initialHasMore: boolean;
}

export function OrderListPaginated({
  initialOrders,
  initialCursor,
  initialHasMore,
}: OrderListPaginatedProps) {
  const { orders, hasMore, isFetchingMore, loadMore } = useOrdersPaginated({
    initialOrders,
    initialCursor,
    initialHasMore,
  });

  return (
    <div>
      <OrderListAnimated orders={orders} />

      {/* Loading skeleton while fetching next page */}
      {isFetchingMore && (
        <div className="mt-4 space-y-4">
          <OrderCardSkeleton />
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </div>
      )}

      {/* Load More button — 44px touch target via size="default" (h-11) */}
      {hasMore && !isFetchingMore && (
        <div className="mt-6 flex justify-center">
          <Button onClick={loadMore} variant="outline" size="default">
            Load More Orders
          </Button>
        </div>
      )}

      {/* End of list indicator */}
      {!hasMore && orders.length > 0 && (
        <p className="text-center text-sm text-text-muted mt-6">All orders loaded</p>
      )}
    </div>
  );
}
