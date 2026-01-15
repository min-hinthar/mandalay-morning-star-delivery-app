import { z } from "zod";

// Vehicle type enum
export const vehicleTypeSchema = z.enum(["car", "van", "truck"]);

// Create driver schema
export const createDriverSchema = z.object({
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number").optional(),
  vehicleType: vehicleTypeSchema.optional(),
  licensePlate: z.string().max(20, "License plate too long").optional(),
});

// Update driver schema
export const updateDriverSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long").optional(),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number").nullable().optional(),
  vehicleType: vehicleTypeSchema.nullable().optional(),
  licensePlate: z.string().max(20, "License plate too long").nullable().optional(),
  profileImageUrl: z.string().url("Invalid image URL").nullable().optional(),
});

// Activate/deactivate driver
export const toggleDriverActiveSchema = z.object({
  isActive: z.boolean(),
});

// Type exports
export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
export type ToggleDriverActiveInput = z.infer<typeof toggleDriverActiveSchema>;
