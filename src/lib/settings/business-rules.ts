import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";

// ===========================================
// TYPES
// ===========================================

export interface BusinessRules {
  cutoffDay: number; // 0=Sunday..6=Saturday
  cutoffHour: number; // 0-23
  deliveryFeeCents: number;
  freeDeliveryThresholdCents: number;
  deliveryStartHour: number; // 0-23
  deliveryEndHour: number; // 1-24
  /**
   * Configurable via admin settings but NOT currently enforced at checkout.
   * Enforcement requires geocoding (address -> coordinates) and distance
   * calculation, which naturally fits a future route optimization phase.
   * Intentionally deferred -- not a bug. See Phase 86 SUMMARY for rationale.
   */
  deliveryRadiusMiles: number;
  /**
   * Configurable via admin settings but NOT currently enforced at checkout.
   * Enforcement requires estimated delivery time calculation from route data.
   * Intentionally deferred -- not a bug. See Phase 86 SUMMARY for rationale.
   */
  maxDeliveryDurationMinutes: number;
  minimumOrderCents: number;
}

// ===========================================
// DEFAULTS (match current hardcoded constants)
// ===========================================

export const BUSINESS_RULES_DEFAULTS: BusinessRules = {
  cutoffDay: 5, // Friday
  cutoffHour: 15, // 3 PM
  deliveryFeeCents: 1500,
  freeDeliveryThresholdCents: 10000,
  deliveryStartHour: 11,
  deliveryEndHour: 19,
  deliveryRadiusMiles: 40,
  maxDeliveryDurationMinutes: 60,
  minimumOrderCents: 2500,
};

// ===========================================
// DB KEY -> INTERFACE FIELD MAPPING
// ===========================================

const DB_KEY_MAP: Record<string, keyof BusinessRules> = {
  cutoff_day: "cutoffDay",
  cutoff_hour: "cutoffHour",
  base_delivery_fee_cents: "deliveryFeeCents",
  free_delivery_threshold_cents: "freeDeliveryThresholdCents",
  delivery_start_hour: "deliveryStartHour",
  delivery_end_hour: "deliveryEndHour",
  delivery_radius_miles: "deliveryRadiusMiles",
  max_delivery_duration_minutes: "maxDeliveryDurationMinutes",
  minimum_order_cents: "minimumOrderCents",
};

// ===========================================
// CACHED READER
// ===========================================

interface SettingRow {
  key: string;
  value: unknown;
}

async function fetchBusinessRules(): Promise<BusinessRules> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("key, value")
      .eq("category", "delivery")
      .returns<SettingRow[]>();

    if (error || !data) {
      return { ...BUSINESS_RULES_DEFAULTS };
    }

    const rules: BusinessRules = { ...BUSINESS_RULES_DEFAULTS };

    for (const row of data) {
      const field = DB_KEY_MAP[row.key];
      if (field !== undefined && row.value !== null && row.value !== undefined) {
        const numVal = Number(row.value);
        if (!Number.isNaN(numVal)) {
          // All BusinessRules fields are numbers — safe index assignment
          (rules as unknown as Record<string, number>)[field] = numVal;
        }
      }
    }

    return rules;
  } catch {
    return { ...BUSINESS_RULES_DEFAULTS };
  }
}

export const getBusinessRules = unstable_cache(fetchBusinessRules, ["business-rules"], {
  tags: ["business-rules"],
  revalidate: 300,
});
