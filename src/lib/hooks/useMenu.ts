import { useQuery } from "@tanstack/react-query";
import type { MenuResponse, MenuSearchResponse } from "@/types/menu";
import { queryKeys } from "@/lib/queryKeys";

export function useMenu() {
  return useQuery<MenuResponse>({
    queryKey: queryKeys.menu.list(),
    queryFn: async () => {
      const res = await fetch("/api/menu");
      if (!res.ok) {
        throw new Error("Failed to fetch menu");
      }
      return res.json() as Promise<MenuResponse>;
    },
    staleTime: 5 * 60 * 1000,
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
