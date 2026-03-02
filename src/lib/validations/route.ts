import { z } from "zod";

// Route status enum
export const routeStatusSchema = z.enum(["planned", "in_progress", "completed"]);

// Route stop status enum
export const routeStopStatusSchema = z.enum([
  "pending",
  "enroute",
  "arrived",
  "delivered",
  "skipped",
]);

/**
 * Validate that a date string represents a Saturday.
 * Business rule: Deliveries only occur on Saturdays.
 */
function isSaturday(dateString: string): boolean {
  const date = new Date(dateString + "T12:00:00"); // Use noon to avoid timezone issues
  return date.getDay() === 6; // 6 = Saturday
}

// Create route schema
export const createRouteSchema = z.object({
  deliveryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .refine(isSaturday, "Delivery date must be a Saturday"),
  driverId: z.string().uuid("Invalid driver ID").optional(),
  orderIds: z.array(z.string().uuid("Invalid order ID")).min(1, "At least one order required"),
});

// Update route schema
export const updateRouteSchema = z.object({
  driverId: z.string().uuid("Invalid driver ID").nullable().optional(),
  status: routeStatusSchema.optional(),
});

// Add stops to route
export const addStopsSchema = z.object({
  orderIds: z.array(z.string().uuid("Invalid order ID")).min(1, "At least one order required"),
});

// Reorder stops
export const reorderStopsSchema = z.object({
  stopOrder: z
    .array(
      z.object({
        stopId: z.string().uuid("Invalid stop ID"),
        stopIndex: z.number().int().min(0),
      })
    )
    .min(1, "At least one stop required"),
});

// Update stop status
export const updateStopStatusSchema = z.object({
  status: routeStopStatusSchema,
  reason: z.string().min(5).max(500).optional(), // Required for admin overrides
  deliveryNotes: z.string().max(1000).optional(),
});

// Exception resolution
export const resolveExceptionSchema = z.object({
  resolutionNotes: z.string().min(10, "Resolution notes must be at least 10 characters").max(1000),
  newDeliveryDate: z.string().optional(), // ISO date for rescheduling
});

// Route optimization request
export const optimizeRouteSchema = z.object({
  routeId: z.string().uuid("Invalid route ID"),
});

// Reassign stop between routes
export const reassignStopSchema = z.object({
  stopId: z.string().uuid("Invalid stop ID"),
  targetRouteId: z.string().uuid("Invalid target route ID"),
});

// Type exports
export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
export type AddStopsInput = z.infer<typeof addStopsSchema>;
export type ReorderStopsInput = z.infer<typeof reorderStopsSchema>;
export type UpdateStopStatusInput = z.infer<typeof updateStopStatusSchema>;
export type ResolveExceptionInput = z.infer<typeof resolveExceptionSchema>;
export type OptimizeRouteInput = z.infer<typeof optimizeRouteSchema>;
export type ReassignStopInput = z.infer<typeof reassignStopSchema>;
