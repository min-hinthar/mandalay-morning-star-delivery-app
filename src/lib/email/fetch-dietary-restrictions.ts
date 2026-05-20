import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/utils/logger";

export async function fetchDietaryRestrictions(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("customer_settings")
      .select("dietary_restrictions")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      logger.warn("Failed to fetch dietary restrictions for email", {
        userId,
        error: error.message,
      });
      return [];
    }

    const value = data?.dietary_restrictions;
    if (!Array.isArray(value)) return [];
    return value.filter((v): v is string => typeof v === "string" && v.length > 0);
  } catch (err) {
    logger.warn("Exception fetching dietary restrictions for email", {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}
