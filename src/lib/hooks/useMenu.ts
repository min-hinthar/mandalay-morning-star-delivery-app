import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/lib/stores/cart-store";
import type { MenuResponse, MenuSearchResponse } from "@/types/menu";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Phase 111 CFIX-09 D-11 — Menu poll cadence.
 * 3 minutes sits in the middle of the 2-5 minute spec range and keeps
 * peak load trivial (~6.6KB/s at ~100 concurrent customers).
 */
export const MENU_POLL_INTERVAL_MS = 3 * 60 * 1000;

/**
 * Phase 111 CHKP-03 + CFIX-09 — Canonical fetch function for /api/menu.
 *
 * Exported as a named function so Plan 04's step-prefetch in CheckoutClient
 * can call queryClient.prefetchQuery({ queryKey: queryKeys.menu.list(),
 * queryFn: menuQueryFn }) using the SAME fetch implementation that useMenu
 * uses. Without this export, Plan 04 would need a duplicate inline queryFn
 * that could drift from useMenu's error handling / response shape.
 */
export const menuQueryFn = async (): Promise<MenuResponse> => {
  const res = await fetch("/api/menu");
  if (!res.ok) {
    throw new Error("Failed to fetch menu");
  }
  return res.json() as Promise<MenuResponse>;
};

interface UseMenuOptions {
  /**
   * Phase 111 CFIX-09 D-10 D-12 D-13 — When true AND the cart is
   * non-empty, sets refetchInterval to MENU_POLL_INTERVAL_MS so
   * TanStack Query periodically refetches the menu. Deduplicates
   * with manual refetch() calls automatically. Default useMenu()
   * behavior (no polling) is preserved for /menu browsing surfaces.
   */
  pollWhileNonEmpty?: boolean;
}

export function useMenu(options?: UseMenuOptions) {
  const isCartNonEmpty = useCartStore((s) => s.items.length > 0);
  return useQuery<MenuResponse>({
    queryKey: queryKeys.menu.list(),
    queryFn: menuQueryFn,
    staleTime: 5 * 60 * 1000,
    refetchInterval: options?.pollWhileNonEmpty && isCartNonEmpty ? MENU_POLL_INTERVAL_MS : false,
  });
}

export function useMenuSearch(query: string) {
  const trimmedQuery = query.trim();

  return useQuery<MenuSearchResponse>({
    queryKey: queryKeys.menu.search(trimmedQuery),
    queryFn: async () => {
      const res = await fetch(`/api/menu/search?q=${encodeURIComponent(trimmedQuery)}`);
      if (!res.ok) {
        throw new Error("Failed to search menu");
      }
      return res.json() as Promise<MenuSearchResponse>;
    },
    enabled: trimmedQuery.length > 0,
    staleTime: 60 * 1000,
  });
}
