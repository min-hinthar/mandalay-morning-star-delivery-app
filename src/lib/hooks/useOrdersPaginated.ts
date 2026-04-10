"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { OrderSummary } from "@/components/ui/orders/OrderListAnimated";

interface PaginationResponse {
  data: OrderSummary[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    limit: number;
  };
}

interface UseOrdersPaginatedOptions {
  initialOrders: OrderSummary[];
  initialCursor: string | null;
  initialHasMore: boolean;
}

async function fetchOrdersPage(cursor: string): Promise<PaginationResponse> {
  const params = new URLSearchParams({ limit: "10", cursor });
  const res = await fetch(`/api/account/orders?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch orders: ${res.status}`);
  }
  return res.json() as Promise<PaginationResponse>;
}

/**
 * Paginated orders hook with manual cursor tracking.
 * Uses useQuery (not useInfiniteQuery) per D-09 -- simpler mental model.
 * Initial data comes from SSR; subsequent pages fetched client-side.
 */
export function useOrdersPaginated({
  initialOrders,
  initialCursor,
  initialHasMore,
}: UseOrdersPaginatedOptions) {
  const [allOrders, setAllOrders] = useState<OrderSummary[]>(initialOrders);
  const [nextCursor, setNextCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  // The cursor we're actively fetching — null when idle
  const [activeCursor, setActiveCursor] = useState<string | null>(null);
  const mergedRef = useRef(false);

  const { data, isFetching } = useQuery({
    queryKey: queryKeys.orders.list(activeCursor ?? undefined),
    queryFn: () => fetchOrdersPage(activeCursor!),
    enabled: activeCursor !== null,
    staleTime: 60_000,
  });

  // Merge fetched page into accumulated orders
  useEffect(() => {
    if (!data || !activeCursor || mergedRef.current) return;
    mergedRef.current = true;

    setAllOrders((prev) => [...prev, ...data.data]);
    setNextCursor(data.pagination.nextCursor);
    setHasMore(data.pagination.hasMore);
    setActiveCursor(null);
  }, [data, activeCursor]);

  // Reset merge guard when activeCursor changes
  useEffect(() => {
    if (activeCursor !== null) {
      mergedRef.current = false;
    }
  }, [activeCursor]);

  const loadMore = useCallback(() => {
    if (!hasMore || activeCursor !== null || nextCursor == null) return;
    setActiveCursor(nextCursor);
  }, [hasMore, activeCursor, nextCursor]);

  const isFetchingMore = activeCursor !== null && isFetching;

  return { orders: allOrders, hasMore, isFetchingMore, loadMore };
}
