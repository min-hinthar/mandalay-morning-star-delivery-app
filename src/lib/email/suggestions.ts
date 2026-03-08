import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/utils/logger";

const SUGGESTION_COUNT = 3;

export interface SuggestedItem {
  name: string;
  imageUrl: string | null;
  slug: string;
}

/**
 * Fetch random active menu items for email "you might also like" section.
 * Excludes items the customer already ordered.
 * Returns empty array on failure (callers fall back to defaults).
 */
export async function fetchSuggestedItems(
  supabase: SupabaseClient,
  excludeNames?: string[]
): Promise<SuggestedItem[]> {
  try {
    let query = supabase
      .from("menu_items")
      .select("name_en, image_url, slug")
      .eq("is_active", true)
      .eq("is_sold_out", false);

    if (excludeNames && excludeNames.length > 0) {
      query = query.not("name_en", "in", `(${excludeNames.join(",")})`);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      if (error) {
        logger.warn("Failed to fetch suggested items for email", {
          error: error.message,
        });
      }
      return [];
    }

    // Shuffle and pick SUGGESTION_COUNT items
    return data
      .map((item) => ({ item, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .slice(0, SUGGESTION_COUNT)
      .map(({ item }) => ({
        name: item.name_en,
        imageUrl: item.image_url,
        slug: item.slug,
      }));
  } catch (err) {
    logger.warn("Error fetching suggested items for email", {
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}
