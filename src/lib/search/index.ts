/**
 * Search Library
 *
 * Fuse.js fuzzy search infrastructure for menu items.
 * Provides memoized search, category helpers, and configuration.
 */

// Config
export { FUSE_CONFIG, CATEGORY_EMOJI_MAP, SCORE_THRESHOLD } from "./search-config";

// Fuzzy search hook
export { useFuzzySearch } from "./use-fuzzy-search";
export type { EnrichedMenuItem, FuseSearchResult } from "./use-fuzzy-search";

// Category helpers
export {
  groupResultsByCategory,
  getCategoryEmoji,
  deriveCategoryTabs,
} from "./category-helpers";
