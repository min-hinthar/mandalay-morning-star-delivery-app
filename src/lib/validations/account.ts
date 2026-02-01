import { z } from "zod";

// Profile update schema
export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number")
    .optional(),
  // email updates require verification, handle separately
});

// Address schemas
export const createAddressSchema = z.object({
  label: z.string().max(50).optional(), // "Home", "Work", etc.
  line1: z.string().min(5).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  postalCode: z.string().min(3).max(20),
  lat: z.number().optional(),
  lng: z.number().optional(),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = createAddressSchema.partial();

// Cancel order schema
export const cancelOrderSchema = z.object({
  reason: z
    .string()
    .min(10, "Please provide a reason (at least 10 characters)")
    .max(500),
});

// Types
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
