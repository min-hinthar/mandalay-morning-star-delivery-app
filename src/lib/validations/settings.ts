import { z } from "zod";

// ===========================================
// KEY NORMALIZATION
// ===========================================

/**
 * camelCase → snake_case on TOP-LEVEL KEYS ONLY, leaving values untouched.
 *
 * The admin settings PATCH stores snake_case keys but the client sends
 * camelCase, and the two conventions used to be reconciled only in the storage
 * loop — validation ran against the raw camelCase body, matched nothing, and
 * every bound was inert. Both paths now go through this one function so they
 * cannot diverge again.
 *
 * Two properties this MUST keep:
 *
 * 1. TOP-LEVEL ONLY. Nested items are camelCase — `delivery_fee_bands` items
 *    are `{ maxMiles, feeCents }` (confirmed against the stored value), and the
 *    admin client's zone type is `{ name, feeCents, description }`. A deep
 *    conversion would rewrite those to snake_case and fail
 *    `deliveryFeeBandSchema`, rejecting every bands save.
 *
 * 2. IDEMPOTENT. Callers already mix conventions — `DeliveryDaysManager`
 *    PATCHes `{ cod_enabled }` in snake_case while `SettingsClient` sends
 *    camelCase. A key with no uppercase left is unchanged by a second pass,
 *    which is exactly why the storage loop survived the mixed convention.
 */
export function toSnakeCaseKeys(settings: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(settings)) {
    out[key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)] = value;
  }
  return out;
}

// ===========================================
// SHARED SCHEMAS
// ===========================================

const hhmmRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * The `app_settings.delivery_zones` blob (name/fee/description) — NOT the
 * `delivery_zones` TABLE that drives direction routing, which is a different
 * shape entirely (bearings).
 *
 * The fee key accepts BOTH conventions on purpose. This schema was written
 * `fee_cents`, but the admin client's `DeliveryZone` type is `feeCents` and
 * nothing in the app emits `fee_cents` — so now that the schema is live
 * (previously inert), requiring snake_case would 400 any zone the client ever
 * saved. There is no zones editor and no `app_settings.delivery_zones` row
 * today, so rather than guess which convention a future or pre-existing row
 * uses, accept either and require one. `toSnakeCaseKeys` deliberately does not
 * reach nested keys, so neither is rewritten on the way in.
 */
export const deliveryZoneSchema = z
  .object({
    name: z.string().min(1),
    description: z.string(),
    feeCents: z.number().min(0).optional(),
    fee_cents: z.number().min(0).optional(),
  })
  .refine((zone) => zone.feeCents != null || zone.fee_cents != null, {
    message: "Zone must define a fee (feeCents or fee_cents)",
    path: ["feeCents"],
  });

/** A single graduated distance band: flat fee up to `maxMiles`. */
export const deliveryFeeBandSchema = z.object({
  maxMiles: z.number().min(1).max(100),
  feeCents: z.number().int().min(0).max(100_000),
});

export const dayHoursSchema = z.object({
  open: z.string().regex(hhmmRegex, "Must be HH:MM format"),
  close: z.string().regex(hhmmRegex, "Must be HH:MM format"),
  closed: z.boolean(),
});

export const weeklyStoreHoursSchema = z.object({
  monday: dayHoursSchema,
  tuesday: dayHoursSchema,
  wednesday: dayHoursSchema,
  thursday: dayHoursSchema,
  friday: dayHoursSchema,
  saturday: dayHoursSchema,
  sunday: dayHoursSchema,
});

export const deliveryTimeWindowSchema = z.object({
  start: z.string().regex(hhmmRegex, "Must be HH:MM format"),
  end: z.string().regex(hhmmRegex, "Must be HH:MM format"),
  label: z.string().optional(),
});

// ===========================================
// DELIVERY SETTINGS
// ===========================================

/** Base delivery settings object (used for .partial() in update validation) */
export const deliverySettingsBaseSchema = z.object({
  delivery_radius_miles: z.number().min(1).max(100),
  // Bounds mirror the admin form's own validator (`validateDeliveryField`), so
  // a direct API PATCH can't persist what the UI refuses to accept. Before the
  // key-normalization fix these never ran at all.
  minimum_order_cents: z.number().min(0).max(10_000),
  free_delivery_threshold_cents: z.number().min(0),
  base_delivery_fee_cents: z.number().min(0),
  cutoff_day: z.number().int().min(0).max(6), // 0=Sunday..6=Saturday
  cutoff_hour: z.number().int().min(0).max(23),
  delivery_start_hour: z.number().int().min(0).max(23),
  delivery_end_hour: z.number().int().min(1).max(24), // 24 = midnight end
  max_delivery_duration_minutes: z.number().int().min(1).max(480),
  delivery_zones: z.array(deliveryZoneSchema).optional(),
  cod_enabled: z.boolean().optional(),
  long_distance_fee_cents: z.number().min(0).optional(),
  long_distance_threshold_miles: z.number().min(1).max(100).optional(),
  delivery_fee_bands: z.array(deliveryFeeBandSchema).max(6).optional(),
  extended_delivery_enabled: z.boolean().optional(),
  extended_delivery_per_mile_cents: z.number().int().min(0).max(100_000).optional(),
  max_delivery_radius_miles: z.number().min(1).max(100).optional(),
  // Matches the admin form's own cap (validateDeliveryField: $500) so a direct
  // API set can't exceed what the UI allows. This bound — and every other one
  // in this schema — is LIVE as of #207; it was previously inert because the
  // route parsed the camelCase body against these snake_case keys, matched
  // nothing, and got `success: true` with `data: {}`.
  extended_min_order_cents: z.number().int().min(0).max(50_000).optional(),
});

/** Full delivery settings with cross-field validation */
export const deliverySettingsSchema = deliverySettingsBaseSchema.refine(
  (data) => data.delivery_end_hour > data.delivery_start_hour,
  {
    message: "End hour must be after start hour",
    path: ["delivery_end_hour"],
  }
);

export type DeliverySettings = z.infer<typeof deliverySettingsSchema>;

// ===========================================
// OPERATIONS SETTINGS
// ===========================================

export const operationsSettingsSchema = z.object({
  max_stops_per_route: z.number().min(1).max(50),
  auto_assign_enabled: z.boolean(),
  route_optimization_enabled: z.boolean().optional(),
  default_vehicle_type: z.enum(["car", "motorcycle", "bicycle", "van", "truck"]).optional(),
  store_hours: weeklyStoreHoursSchema.optional(),
  max_orders_per_slot: z.number().min(1).max(100).optional(),
});

export type OperationsSettings = z.infer<typeof operationsSettingsSchema>;

// ===========================================
// NOTIFICATION SETTINGS
// ===========================================

export const notificationSettingsSchema = z.object({
  email_notifications_enabled: z.boolean(),
  sms_notifications_enabled: z.boolean(),
  push_notifications_enabled: z.boolean(),
  notify_on_order_placed: z.boolean().optional(),
  notify_on_order_status_change: z.boolean().optional(),
  low_stock_threshold: z.number().min(0).max(1000).optional(),
  daily_summary_enabled: z.boolean().optional(),
  // The global email kill switch (`sendEmail` Step 1 reads this key). It was
  // stored but never described here, so it passed validation only because the
  // category schemas are non-strict — i.e. by accident.
  email_sending_enabled: z.boolean().optional(),
});

export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;

// ===========================================
// UPDATE SETTINGS SCHEMA
// ===========================================

export const settingsCategorySchema = z.enum(["delivery", "operations", "notifications"]);

export type SettingsCategory = z.infer<typeof settingsCategorySchema>;

const CATEGORY_SCHEMAS = {
  delivery: deliverySettingsBaseSchema,
  operations: operationsSettingsSchema,
  notifications: notificationSettingsSchema,
} as const;

/**
 * `settings` keys are normalized to snake_case BEFORE the category check, and
 * the normalized object is what `.data` returns — so the PATCH route's storage
 * loop writes exactly the keys that were validated. Validating one convention
 * and storing another is what made every bound inert.
 *
 * `superRefine` (not `refine`) so a rejection names the offending field:
 * `settings.extended_min_order_cents: Too big` instead of a blanket "Invalid
 * settings for the specified category" that tells an admin nothing about which
 * of a dozen values they got wrong.
 */
export const updateSettingsSchema = z
  .object({
    category: settingsCategorySchema,
    settings: z.record(z.string(), z.unknown()).transform(toSnakeCaseKeys),
  })
  .superRefine((data, ctx) => {
    const result = CATEGORY_SCHEMAS[data.category].partial().safeParse(data.settings);
    if (result.success) return;

    for (const issue of result.error.issues) {
      ctx.addIssue({
        code: "custom",
        path: ["settings", ...issue.path],
        message: issue.message,
      });
    }
  });

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

// ===========================================
// API RESPONSE TYPES
// ===========================================

export interface SettingsResponse {
  delivery: Record<string, unknown>;
  operations: Record<string, unknown>;
  notifications: Record<string, unknown>;
}

export interface SettingRow {
  id: string;
  key: string;
  value: unknown;
  category: SettingsCategory;
  updated_at: string;
  updated_by: string | null;
}
