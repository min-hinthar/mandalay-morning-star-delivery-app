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

// Create route schema
export const createRouteSchema = z.object({
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
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
  stopOrder: z.array(
    z.object({
      stopId: z.string().uuid("Invalid stop ID"),
      stopIndex: z.number().int().min(0),
    })
  ).min(1, "At least one stop required"),
});

// Update stop status
export const updateStopStatusSchema = z.object({
  status: routeStopStatusSchema,
  deliveryNotes: z.string().max(500, "Notes too long").optional(),
});

// Route optimization request
export const optimizeRouteSchema = z.object({
  routeId: z.string().uuid("Invalid route ID"),
});

// Type exports
export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
export type AddStopsInput = z.infer<typeof addStopsSchema>;
export type ReorderStopsInput = z.infer<typeof reorderStopsSchema>;
export type UpdateStopStatusInput = z.infer<typeof updateStopStatusSchema>;
export type OptimizeRouteInput = z.infer<typeof optimizeRouteSchema>;
