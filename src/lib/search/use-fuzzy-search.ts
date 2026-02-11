"use client";

import Fuse, { type FuseResultMatch } from "fuse.js";
import { useMemo, useCallback } from "react";
import type { MenuItem, MenuCategory } from "@/types/menu";
import { FUSE_CONFIG, SCORE_THRESHOLD } from "./search-config";

/**
 * MenuItem enriched with category context.
 * Prefixed with underscore to signal internal-only fields.
 */
export interface EnrichedMenuItem extends MenuItem {
  _categoryName: string;
  _categorySlug: string;
}

/**
 * Individual Fuse.js search result with score and match indices.
 */
export interface FuseSearchResult {
  item: EnrichedMenuItem;
  score?: number;
  matches?: readonly FuseResultMatch[];
}

/**
 * Hook wrapping Fuse.js for fuzzy menu item search.
 *
 * - Enriches items with category metadata
 * - Memoizes Fuse index (only recreated when menu data changes)
 * - Filters results by SCORE_THRESHOLD
 *
 * @param categories - Menu categories from useMenu()
 * @returns search function, enriched items, and raw Fuse instance
 */
export function useFuzzySearch(categories: MenuCategory[]) {
  // Enrich items with category info for grouping and emoji fallback
  const enrichedItems = useMemo(
    () =>
      categories.flatMap((cat) =>
        cat.items.map((item) => ({
          ...item,
          _categoryName: cat.name,
          _categorySlug: cat.slug,
        }))
      ),
    [categories]
  );

  // Memoized Fuse index -- only recreated when enrichedItems change
  const fuse = useMemo(
    () => new Fuse(enrichedItems, FUSE_CONFIG),
    [enrichedItems]
  );

  // Search function that filters by score threshold
  const search = useCallback(
    (query: string): FuseSearchResult[] => {
      const results = fuse.search(query);
      return results.filter(
        (r) => r.score !== undefined && r.score <= SCORE_THRESHOLD
      );
    },
    [fuse]
  );

  return { search, enrichedItems, fuse };
}
