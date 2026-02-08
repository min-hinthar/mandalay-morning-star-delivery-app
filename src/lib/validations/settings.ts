import { z } from "zod";

// ===========================================
// SHARED SCHEMAS
// ===========================================

const hhmmRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const deliveryZoneSchema = z.object({
  name: z.string().min(1),
  fee_cents: z.number().min(0),
  description: z.string(),
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

export const deliverySettingsSchema = z.object({
  delivery_radius_miles: z.number().min(1).max(100),
  minimum_order_cents: z.number().min(0),
  free_delivery_threshold_cents: z.number().min(0),
  base_delivery_fee_cents: z.number().min(0),
  delivery_cutoff_time: z.string().regex(hhmmRegex, "Must be HH:MM format").optional(),
  delivery_time_windows: z.array(deliveryTimeWindowSchema).optional(),
  delivery_zones: z.array(deliveryZoneSchema).optional(),
});

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
});

export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;

// ===========================================
// UPDATE SETTINGS SCHEMA
// ===========================================

export const settingsCategorySchema = z.enum(["delivery", "operations", "notifications"]);

export type SettingsCategory = z.infer<typeof settingsCategorySchema>;

export const updateSettingsSchema = z.object({
  category: settingsCategorySchema,
  settings: z.record(z.string(), z.unknown()),
}).refine(
  (data) => {
    // Validate settings based on category
    switch (data.category) {
      case "delivery":
        return deliverySettingsSchema.partial().safeParse(data.settings).success;
      case "operations":
        return operationsSettingsSchema.partial().safeParse(data.settings).success;
      case "notifications":
        return notificationSettingsSchema.partial().safeParse(data.settings).success;
      default:
        return false;
    }
  },
  {
    message: "Invalid settings for the specified category",
  }
);

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
