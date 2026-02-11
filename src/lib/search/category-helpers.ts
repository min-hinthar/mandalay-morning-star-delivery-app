import type { MenuCategory } from "@/types/menu";
import type { FuseSearchResult } from "./use-fuzzy-search";
import { CATEGORY_EMOJI_MAP } from "./search-config";

/**
 * Group Fuse search results by category slug.
 * Preserves Fuse relevance ordering within each group.
 */
export function groupResultsByCategory(
  results: FuseSearchResult[]
): Map<string, FuseSearchResult[]> {
  const groups = new Map<string, FuseSearchResult[]>();

  for (const result of results) {
    const slug = result.item._categorySlug;
    const group = groups.get(slug);
    if (group) {
      group.push(result);
    } else {
      groups.set(slug, [result]);
    }
  }

  return groups;
}

/**
 * Get emoji fallback for a category slug.
 * Returns steaming bowl as default for unknown categories.
 */
export function getCategoryEmoji(categorySlug: string): string {
  return CATEGORY_EMOJI_MAP[categorySlug] ?? "\u{1F35C}";
}

/**
 * Derive category tabs from search results.
 *
 * Returns tabs in menu sort order (matching main menu browse experience),
 * only including categories that have matching results, with result counts.
 */
export function deriveCategoryTabs(
  results: FuseSearchResult[],
  categories: MenuCategory[]
): { slug: string; name: string; count: number }[] {
  const grouped = groupResultsByCategory(results);

  return categories
    .filter((cat) => grouped.has(cat.slug))
    .map((cat) => ({
      slug: cat.slug,
      name: cat.name,
      count: grouped.get(cat.slug)!.length,
    }));
}
