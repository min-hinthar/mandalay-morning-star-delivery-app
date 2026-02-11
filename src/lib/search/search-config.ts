import type { IFuseOptions } from "fuse.js";
import type { EnrichedMenuItem } from "./use-fuzzy-search";

/**
 * Fuse.js configuration tuned for Burmese dish name fuzzy matching.
 *
 * Key tuning rationale:
 * - threshold 0.2: strict matching — near-exact only ("mohiga" -> "Mohinga")
 * - ignoreLocation: true: match anywhere in string, not just start
 * - distance 100: focused match window
 * - minMatchCharLength 2: skip single-character noise
 */
export const FUSE_CONFIG: IFuseOptions<EnrichedMenuItem> = {
  keys: [
    { name: "nameEn", weight: 3 },
    { name: "nameMy", weight: 2 },
    { name: "descriptionEn", weight: 1 },
    { name: "_categoryName", weight: 0.5 },
    { name: "tags", weight: 0.5 },
  ],
  threshold: 0.2,
  distance: 100,
  ignoreLocation: true,
  includeMatches: true,
  includeScore: true,
  minMatchCharLength: 2,
  shouldSort: true,
};

/**
 * Category slug to emoji fallback map.
 * Used when menu item thumbnails are missing/loading.
 */
export const CATEGORY_EMOJI_MAP: Record<string, string> = {
  "all-day-breakfast": "\u{1F373}",
  "rice-noodles-soups": "\u{1F35C}",
  "sides": "\u{1F961}",
  "curries-a-la-carte": "\u{1F35B}",
  "vegetables": "\u{1F966}",
  "seafood-curries": "\u{1F990}",
  "appetizers-salads": "\u{1F957}",
  "drinks": "\u{1F9CB}",
};

/**
 * Fuse score threshold for filtering low-quality results.
 * Fuse scores: 0 = perfect match, 1 = no match.
 * Results with score > SCORE_THRESHOLD are discarded.
 */
export const SCORE_THRESHOLD = 0.35;
