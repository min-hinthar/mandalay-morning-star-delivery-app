import { z } from "zod";

/**
 * V2 Sprint 2: Driver API Validation Schemas
 */

// Stop status update
export const updateStopStatusSchema = z.object({
  status: z.enum(["enroute", "arrived", "delivered", "skipped"]),
  deliveryNotes: z.string().max(500).optional(),
});

// Location update (rate limited to 1/min server-side)
export const locationUpdateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().min(0).optional(),
  routeId: z.string().uuid().optional(),
});

// Report delivery exception
export const reportExceptionSchema = z.object({
  type: z.enum([
    "customer_not_home",
    "wrong_address",
    "access_issue",
    "refused_delivery",
    "damaged_order",
    "other",
  ]),
  description: z.string().max(1000).optional(),
});

// Complete route
export const completeRouteSchema = z.object({
  notes: z.string().max(1000).optional(),
});

// Type exports
export type UpdateStopStatusInput = z.infer<typeof updateStopStatusSchema>;
export type LocationUpdateInput = z.infer<typeof locationUpdateSchema>;
export type ReportExceptionInput = z.infer<typeof reportExceptionSchema>;
export type CompleteRouteInput = z.infer<typeof completeRouteSchema>;

// Valid status transitions for stop status
export const VALID_STOP_TRANSITIONS: Record<string, string[]> = {
  pending: ["enroute", "skipped"],
  enroute: ["arrived", "skipped"],
  arrived: ["delivered", "skipped"],
  delivered: [], // Terminal state
  skipped: [], // Terminal state
};

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  const validTransitions = VALID_STOP_TRANSITIONS[currentStatus] ?? [];
  return validTransitions.includes(newStatus);
}

/**
 * Get the next expected status for a stop
 */
export function getNextStopStatus(
  currentStatus: string
): string | null {
  const transitions: Record<string, string> = {
    pending: "enroute",
    enroute: "arrived",
    arrived: "delivered",
  };
  return transitions[currentStatus] ?? null;
}
