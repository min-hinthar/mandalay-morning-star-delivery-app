import { z } from "zod";

// Individual field schemas
export const dietaryRestrictionSchema = z.string().max(50);

export const notificationPrefsSchema = z.object({
  order_updates: z.boolean(),
  marketing: z.boolean(),
  reminders: z.boolean(),
});

// Main update schema — all fields optional (partial update)
export const updateCustomerSettingsSchema = z.object({
  dietary_restrictions: z.array(dietaryRestrictionSchema).max(20).optional(),
  delivery_instructions: z.string().max(500).optional(),
  notification_prefs: notificationPrefsSchema.optional(),
  theme: z.enum(["system", "light", "dark"]).optional(),
});

// Inferred type
export type UpdateCustomerSettingsInput = z.infer<
  typeof updateCustomerSettingsSchema
>;
