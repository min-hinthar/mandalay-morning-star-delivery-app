"use client";

import { Command } from "cmdk";
import { AnimatePresence, m } from "framer-motion";
import type { EnrichedMenuItem, FuseSearchResult } from "@/lib/search";
import { SearchResultCard } from "./SearchResultCard";

export interface SearchResultsProps {
  /** Fuse.js search results with match data */
  results: FuseSearchResult[];
  /** Callback when an item is selected */
  onSelect: (item: EnrichedMenuItem) => void;
}

/**
 * Search results list rendering rich SearchResultCards.
 *
 * Features:
 * - Rich cards with 64px thumbnails, badges, tags
 * - Fuse.js match highlighting passed through to each card
 * - Staggered fade-in entrance animation
 * - ~8-10 results visible before scrolling via compact card height
 */
export function SearchResults({ results, onSelect }: SearchResultsProps) {
  if (results.length === 0) {
    return null;
  }

  return (
    <Command.Group heading="">
      <AnimatePresence mode="wait">
        <m.div
          key="search-results-list"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="py-1"
        >
          {results.map((result, index) => (
            <SearchResultCard
              key={result.item.id}
              item={result.item}
              matches={result.matches}
              onSelect={onSelect}
              index={index}
            />
          ))}
        </m.div>
      </AnimatePresence>
    </Command.Group>
  );
}

export default SearchResults;
