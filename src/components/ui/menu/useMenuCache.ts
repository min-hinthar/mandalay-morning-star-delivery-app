"use client";

import { useState, useEffect, useRef } from "react";
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
 * IDB-first menu caching: loads cached data immediately on mount,
 * transitions to fresh data when network succeeds, falls back to
 * cache on error. Tracks stale state for StaleBadge.
 */
export function useMenuCache({ data, categories, error, isLoading }: UseMenuCacheParams) {
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [cachedCategories, setCachedCategories] = useState<MenuCategory[]>([]);
  const idbLoadedRef = useRef(false);

  // Phase 1: Load IDB cache immediately on mount (per D-13)
  // This runs ONCE on mount — provides instant data before network resolves
  useEffect(() => {
    if (idbLoadedRef.current) return;
    idbLoadedRef.current = true;

    menuCache
      .get()
      .then((cached) => {
        if (!cached) return;

        // Skip stale cache (>24h) per D-15
        if (menuCache.isStale(cached.cachedAt)) {
          logger.info("[useMenuCache] IDB cache stale (>24h), skipping");
          return;
        }

        const menuResponse = cached.data as MenuResponse;
        const cats = menuResponse?.data?.categories ?? [];
        if (cats.length > 0) {
          setCachedCategories(cats);
          setCachedAt(cached.cachedAt);
          setUsingCachedData(true);
        }
      })
      .catch((err) => {
        logger.error("[useMenuCache] Failed to load IDB cache on mount", {
          error: String(err),
        });
      });
  }, []);

  // Phase 2: When fresh data arrives from network, save to IDB and switch
  useEffect(() => {
    if (data?.data?.categories && data.data.categories.length > 0) {
      // Fresh data arrived — save and transition
      menuCache.save(data).catch((err) => {
        logger.error("[useMenuCache] Failed to save menu to IDB", {
          error: String(err),
        });
      });
      setUsingCachedData(false);
      setCachedAt(null);
    }
  }, [data]);

  // If network fails AND no IDB data was loaded, try IDB again (backward compat)
  useEffect(() => {
    if (error && !isLoading && !usingCachedData && cachedCategories.length === 0) {
      menuCache
        .get()
        .then((cached) => {
          if (cached && !menuCache.isStale(cached.cachedAt)) {
            const menuResponse = cached.data as MenuResponse;
            const cats = menuResponse?.data?.categories ?? [];
            if (cats.length > 0) {
              setCachedCategories(cats);
              setCachedAt(cached.cachedAt);
              setUsingCachedData(true);
            }
          }
        })
        .catch((err) => {
          logger.error("[useMenuCache] Failed to load IDB fallback", {
            error: String(err),
          });
        });
    }
  }, [error, isLoading, usingCachedData, cachedCategories.length]);

  // Use direct state values (per D-16 — no useMemo + getState() pattern)
  const displayCategories = usingCachedData ? cachedCategories : categories;

  return { displayCategories, cachedAt, usingCachedData };
}
