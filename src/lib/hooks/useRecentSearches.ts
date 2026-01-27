"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "mms-recent-searches";
const MAX_SEARCHES = 5;

export interface UseRecentSearchesReturn {
  /** Array of recent search terms */
  recentSearches: string[];
  /** Add a search term to recent searches */
  addSearch: (term: string) => void;
  /** Clear all recent searches */
  clearSearches: () => void;
}

/**
 * Manages recent search history with localStorage persistence
 *
 * Features:
 * - Stores up to 5 recent searches
 * - SSR-safe with hydration protection
 * - Deduplicates searches (moves existing to top)
 * - Persists across sessions
 *
 * @example
 * ```tsx
 * function SearchComponent() {
 *   const { recentSearches, addSearch, clearSearches } = useRecentSearches();
 *
 *   const handleSearch = (term: string) => {
 *     addSearch(term);
 *     // ... perform search
 *   };
 *
 *   return (
 *     <div>
 *       {recentSearches.map((term) => (
 *         <button key={term} onClick={() => handleSearch(term)}>
 *           {term}
 *         </button>
 *       ))}
 *       <button onClick={clearSearches}>Clear</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useRecentSearches(): UseRecentSearchesReturn {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Hydrate from localStorage on mount (SSR-safe)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, MAX_SEARCHES));
        }
      }
    } catch {
      // Ignore localStorage errors (private browsing, etc.)
    }
  }, []);

  const addSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;

    setRecentSearches((prev) => {
      // Remove duplicate if exists (will be added to top)
      const filtered = prev.filter(
        (search) => search.toLowerCase() !== trimmed.toLowerCase()
      );
      // Add to top, limit to max
      const updated = [trimmed, ...filtered].slice(0, MAX_SEARCHES);

      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }

      return updated;
    });
  }, []);

  const clearSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  return {
    recentSearches,
    addSearch,
    clearSearches,
  };
}

export default useRecentSearches;
