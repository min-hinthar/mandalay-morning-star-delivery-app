"use client";

import Fuse from "fuse.js";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

/**
 * Lightweight representation of a past order item for search.
 */
export interface OrderHistoryItem {
  orderId: string;
  nameSnapshot: string;
  placedAt: string;
  quantity: number;
}

/**
 * Fetches user's past order items and provides fuzzy search over them.
 *
 * - Fetches up to 100 most recent order items via Supabase
 * - Creates memoized Fuse index for client-side fuzzy matching
 * - Returns max 5 matching items when query is non-empty
 * - Handles unauthenticated gracefully (returns empty, no error)
 *
 * @param query - Search query string
 * @param userId - Authenticated user ID (undefined if not logged in)
 */
export function useOrderHistorySearch(query: string, userId?: string): OrderHistoryItem[] {
  // Fetch order items for search (small dataset per user)
  const { data: orderItems } = useQuery({
    queryKey: ["order-items-for-search", userId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("order_items")
        .select("name_snapshot, quantity, orders!inner(id, placed_at, user_id)")
        .eq("orders.user_id", userId!)
        .order("orders(placed_at)", { ascending: false })
        .limit(100);

      if (error) return [];

      // Transform to OrderHistoryItem[]
      return (data ?? []).map((row: Record<string, unknown>) => {
        const orders = row.orders as
          | { id: string; placed_at: string }
          | { id: string; placed_at: string }[];
        const order = Array.isArray(orders) ? orders[0] : orders;

        return {
          orderId: order?.id ?? "",
          nameSnapshot: (row.name_snapshot as string) ?? "",
          placedAt: order?.placed_at ?? "",
          quantity: (row.quantity as number) ?? 1,
        };
      });
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Memoized Fuse index on fetched data
  const fuse = useMemo(() => {
    if (!orderItems?.length) return null;
    return new Fuse(orderItems, {
      keys: ["nameSnapshot"],
      threshold: 0.4,
      ignoreLocation: true,
    });
  }, [orderItems]);

  // Search and return top 5
  const results = useMemo(() => {
    if (!fuse || !query.trim()) return [];
    return fuse
      .search(query)
      .slice(0, 5)
      .map((r) => r.item);
  }, [fuse, query]);

  return results;
}
