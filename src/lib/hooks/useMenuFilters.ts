"use client";

import { useState, useCallback } from "react";
import type { MenuCategory, MenuItem } from "@/types/menu";

// ============================================
// TYPES
// ============================================

export interface UseMenuFiltersReturn {
  /** Current search query */
  query: string;
  /** Update search query */
  setQuery: (query: string) => void;
  /** Active dietary filters */
  dietaryFilters: string[];
  /** Update dietary filters */
  setDietaryFilters: (filters: string[]) => void;
  /** Whether any filters are active */
  hasActiveFilters: boolean;
  /** Clear all filters */
  clearFilters: () => void;
  /** Apply text + dietary + sold-out filtering to categories */
  filterItems: (categories: MenuCategory[]) => MenuCategory[];
}

// ============================================
// HELPERS
// ============================================

/** Case-insensitive text match on item name/description fields */
function matchesTextQuery(item: MenuItem, query: string): boolean {
  const q = query.toLowerCase();
  return (
    item.nameEn.toLowerCase().includes(q) ||
    (item.nameMy?.toLowerCase().includes(q) ?? false) ||
    (item.descriptionEn?.toLowerCase().includes(q) ?? false)
  );
}

/** AND logic: item.tags must include ALL active dietary filters */
function matchesDietaryFilters(item: MenuItem, filters: string[]): boolean {
  if (filters.length === 0) return true;
  return filters.every((f) => item.tags.includes(f));
}

/** Stable sort: sold-out items to bottom within category */
function sortSoldOutLast(items: MenuItem[]): MenuItem[] {
  return [...items].sort((a, b) => Number(a.isSoldOut) - Number(b.isSoldOut));
}

// ============================================
// HOOK
// ============================================

export function useMenuFilters(): UseMenuFiltersReturn {
  const [query, setQuery] = useState("");
  const [dietaryFilters, setDietaryFilters] = useState<string[]>([]);

  const hasActiveFilters = query.length > 0 || dietaryFilters.length > 0;

  const clearFilters = useCallback(() => {
    setQuery("");
    setDietaryFilters([]);
  }, []);

  const filterItems = useCallback(
    (categories: MenuCategory[]): MenuCategory[] => {
      const trimmedQuery = query.trim();

      return categories
        .map((category) => {
          let items = category.items ?? [];

          // Text filter
          if (trimmedQuery.length > 0) {
            items = items.filter((item) => matchesTextQuery(item, trimmedQuery));
          }

          // Dietary filter (AND logic)
          if (dietaryFilters.length > 0) {
            items = items.filter((item) => matchesDietaryFilters(item, dietaryFilters));
          }

          // Sold-out sort: available first, sold-out last
          items = sortSoldOutLast(items);

          return { ...category, items };
        })
        .filter((category) => category.items.length > 0); // Prune empty categories
    },
    [query, dietaryFilters]
  );

  return {
    query,
    setQuery,
    dietaryFilters,
    setDietaryFilters,
    hasActiveFilters,
    clearFilters,
    filterItems,
  };
}

export default useMenuFilters;
