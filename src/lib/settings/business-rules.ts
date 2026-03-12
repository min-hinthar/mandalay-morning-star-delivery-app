import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";
import type { DeliveryDayConfig, DeliveryDirection, DeliveryZoneConfig } from "@/types/delivery";

// ===========================================
// TYPES
// ===========================================

export interface BusinessRules {
  /** @deprecated Use deliveryDays[].cutoffDay instead */
  cutoffDay: number;
  /** @deprecated Use deliveryDays[].cutoffHour instead */
  cutoffHour: number;
  /** @deprecated Use deliveryDays[].deliveryFeeCents instead */
  deliveryFeeCents: number;
  freeDeliveryThresholdCents: number;
  deliveryStartHour: number;
  deliveryEndHour: number;
  deliveryRadiusMiles: number;
  maxDeliveryDurationMinutes: number;
  minimumOrderCents: number;
  prepTimeBufferMinutes: number;
  /** Per-day delivery configs from delivery_days table */
  deliveryDays: DeliveryDayConfig[];
  /** Whether Cash on Delivery is enabled */
  codEnabled: boolean;
  /** Fee for addresses >longDistanceThresholdMiles (cents) */
  longDistanceFeeCents: number;
  /** Miles threshold for long-distance fee */
  longDistanceThresholdMiles: number;
  /** Delivery zone bearing configs */
  deliveryZones: DeliveryZoneConfig[];
}

// ===========================================
// DEFAULTS
// ===========================================

export const BUSINESS_RULES_DEFAULTS: BusinessRules = {
  cutoffDay: 5,
  cutoffHour: 15,
  deliveryFeeCents: 1500,
  freeDeliveryThresholdCents: 10000,
  deliveryStartHour: 11,
  deliveryEndHour: 19,
  deliveryRadiusMiles: 50,
  maxDeliveryDurationMinutes: 60,
  minimumOrderCents: 2500,
  prepTimeBufferMinutes: 30,
  deliveryDays: [],
  codEnabled: false,
  longDistanceFeeCents: 2000,
  longDistanceThresholdMiles: 25,
  deliveryZones: [],
};

// ===========================================
// DB KEY -> INTERFACE FIELD MAPPING
// ===========================================

/** Numeric settings from app_settings */
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
  prep_time_buffer_minutes: "prepTimeBufferMinutes",
  long_distance_fee_cents: "longDistanceFeeCents",
  long_distance_threshold_miles: "longDistanceThresholdMiles",
};

// ===========================================
// CACHED READER
// ===========================================

interface SettingRow {
  key: string;
  value: unknown;
}

interface DeliveryDayRow {
  id: string;
  day_of_week: number;
  is_active: boolean;
  cutoff_day: number;
  cutoff_hour: number;
  delivery_fee_cents: number;
  display_order: number;
  direction: string;
}

interface DeliveryZoneRow {
  id: string;
  direction: string;
  bearing_start: number;
  bearing_end: number;
  reference_cities: string[];
}

async function fetchBusinessRules(): Promise<BusinessRules> {
  try {
    const supabase = createPublicClient();

    // Fetch settings, delivery days, and zones in parallel
    const [settingsResult, deliveryDaysResult, zonesResult] = await Promise.all([
      supabase
        .from("app_settings")
        .select("key, value")
        .eq("category", "delivery")
        .returns<SettingRow[]>(),
      supabase
        .from("delivery_days")
        .select(
          "id, day_of_week, is_active, cutoff_day, cutoff_hour, delivery_fee_cents, display_order, direction"
        )
        .order("display_order", { ascending: true })
        .returns<DeliveryDayRow[]>(),
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("delivery_zones" as any)
        .select("id, direction, bearing_start, bearing_end, reference_cities")
        .returns<DeliveryZoneRow[]>(),
    ]);

    const rules: BusinessRules = { ...BUSINESS_RULES_DEFAULTS };

    // Parse numeric settings
    if (settingsResult.data) {
      for (const row of settingsResult.data) {
        // Handle boolean settings separately
        if (row.key === "cod_enabled") {
          rules.codEnabled = row.value === true || row.value === "true";
          continue;
        }

        const field = DB_KEY_MAP[row.key];
        if (field !== undefined && row.value !== null && row.value !== undefined) {
          const numVal = Number(row.value);
          if (!Number.isNaN(numVal)) {
            (rules as unknown as Record<string, number>)[field] = numVal;
          }
        }
      }
    }

    // Map delivery zones
    if (zonesResult.data) {
      rules.deliveryZones = zonesResult.data.map((row) => ({
        id: row.id,
        direction: row.direction as Exclude<DeliveryDirection, "all">,
        bearingStart: row.bearing_start,
        bearingEnd: row.bearing_end,
        referenceCities: row.reference_cities ?? [],
      }));
    }

    // Map delivery days
    if (deliveryDaysResult.data) {
      rules.deliveryDays = deliveryDaysResult.data.map((row) => ({
        id: row.id,
        dayOfWeek: row.day_of_week,
        isActive: row.is_active,
        cutoffDay: row.cutoff_day,
        cutoffHour: row.cutoff_hour,
        deliveryFeeCents: row.delivery_fee_cents,
        displayOrder: row.display_order,
        direction: (row.direction || "all") as DeliveryDirection,
      }));

      // Backward compat: populate legacy fields from first active day
      const firstActive = rules.deliveryDays.find((d) => d.isActive);
      if (firstActive) {
        rules.cutoffDay = firstActive.cutoffDay;
        rules.cutoffHour = firstActive.cutoffHour;
        rules.deliveryFeeCents = firstActive.deliveryFeeCents;
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
