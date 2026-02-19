import { z } from "zod";

// Vehicle type enum (admin-facing, restricted set)
export const vehicleTypeSchema = z.enum(["car", "van", "truck"]);

// Full vehicle type enum (accepts all DB values for backward compatibility)
export const vehicleTypeFullSchema = z.enum(["car", "motorcycle", "bicycle", "van", "truck"]);

// Create driver schema
export const createDriverSchema = z.object({
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number")
    .optional(),
  vehicleType: vehicleTypeSchema.optional(),
  licensePlate: z.string().max(20, "License plate too long").optional(),
});

// Update driver schema
export const updateDriverSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long")
    .optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number")
    .nullable()
    .optional(),
  vehicleType: vehicleTypeSchema.nullable().optional(),
  licensePlate: z.string().max(20, "License plate too long").nullable().optional(),
  profileImageUrl: z.string().url("Invalid image URL").nullable().optional(),
});

// Driver self-update schema (used by /api/driver/profile)
// Relaxed validation compared to admin schema — accepts broader phone formats
export const driverSelfUpdateSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long")
    .optional(),
  phone: z
    .string()
    .min(5, "Please enter a valid phone number")
    .max(20, "Phone number too long")
    .optional(),
  vehicleType: vehicleTypeFullSchema.nullable().optional(),
  licensePlate: z.string().max(30, "License plate too long").nullable().optional(),
});

// Activate/deactivate driver
export const toggleDriverActiveSchema = z.object({
  isActive: z.boolean(),
});

// Archive driver schema
export const archiveDriverSchema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters").max(500, "Reason too long"),
});

// Type exports
export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
export type DriverSelfUpdateInput = z.infer<typeof driverSelfUpdateSchema>;
export type ToggleDriverActiveInput = z.infer<typeof toggleDriverActiveSchema>;
export type ArchiveDriverInput = z.infer<typeof archiveDriverSchema>;
