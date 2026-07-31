import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/utils/logger";

const SUGGESTION_COUNT = 3;

export interface SuggestedItem {
  name: string;
  imageUrl: string | null;
  slug: string;
}

/**
 * Deterministic 32-bit string hash (FNV-1a). Used to shuffle reproducibly.
 */
function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/**
 * Fetch active menu items for the email "you might also like" section.
 * Excludes items the customer already ordered.
 * Returns empty array on failure (callers fall back to defaults).
 *
 * `seed` makes the pick REPRODUCIBLE, and callers that send with a Resend
 * idempotency key must pass one. Resend rejects a reused key whose request body
 * differs ("invalid idempotent request"), so a `Math.random()` pick would make
 * the second call for the same key — e.g. order-confirmation firing from both
 * the Stripe webhook and verify-payment — fail every retry and wrongly flag the
 * order `needs_contact`, even though the first email went out fine. Same seed ⇒
 * same dishes ⇒ byte-identical payload ⇒ Resend returns the original send.
 */
export async function fetchSuggestedItems(
  supabase: SupabaseClient,
  excludeNames?: string[],
  seed?: string
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

    // Shuffle and pick SUGGESTION_COUNT items. Seeded ⇒ stable across calls
    // (see the note on `seed`); unseeded keeps the old random behaviour, with a
    // secondary sort by slug so equal hashes still order deterministically.
    return data
      .map((item) => ({
        item,
        sort: seed == null ? Math.random() : hashString(`${seed}:${item.slug}`),
      }))
      .sort((a, b) => a.sort - b.sort || a.item.slug.localeCompare(b.item.slug))
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
