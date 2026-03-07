"use client";

import { useState, useEffect } from "react";
import { menuCache } from "@/lib/services/customer-offline-store";
import { logger } from "@/lib/utils/logger";
import type { MenuCategory, MenuResponse } from "@/types/menu";

interface UseMenuCacheParams {
  /** Raw data from useMenu() query */
  data: { data?: { categories?: MenuCategory[] } } | undefined;
  /** Parsed categories from the data */
  categories: MenuCategory[];
  /** Query error (truthy when fetch failed) */
  error: unknown;
  /** Whether the query is still loading */
  isLoading: boolean;
}

/**
 * Manages offline menu caching: saves fresh data to IndexedDB,
 * loads cached data on error, and tracks stale state.
 */
export function useMenuCache({ data, categories, error, isLoading }: UseMenuCacheParams) {
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [cachedCategories, setCachedCategories] = useState<MenuCategory[]>([]);

  // Save menu data to cache when successfully fetched
  useEffect(() => {
    if (data?.data?.categories && data.data.categories.length > 0) {
      menuCache.save(data).catch((err) => {
        logger.error("[MenuContent] Failed to cache menu", { error: String(err) });
      });
      setUsingCachedData(false);
      setCachedAt(null);
    }
  }, [data]);

  // Load from cache on error (offline fallback)
  useEffect(() => {
    if (error && !isLoading) {
      menuCache
        .get()
        .then((cached) => {
          if (cached) {
            setCachedAt(cached.cachedAt);
            setUsingCachedData(true);
          }
        })
        .catch((err) => {
          logger.error("[MenuContent] Failed to load cached menu", { error: String(err) });
        });
    }
  }, [error, isLoading]);

  // Get cached categories when using offline data
  useEffect(() => {
    if (usingCachedData) {
      menuCache
        .get()
        .then((cached) => {
          if (cached?.data) {
            const menuResponse = cached.data as MenuResponse;
            setCachedCategories(menuResponse.data?.categories ?? []);
          }
        })
        .catch((err) => {
          logger.error("[MenuContent] Failed to read cached categories", { error: String(err) });
        });
    }
  }, [usingCachedData]);

  const displayCategories = usingCachedData ? cachedCategories : categories;

  return { displayCategories, cachedAt, usingCachedData };
}
