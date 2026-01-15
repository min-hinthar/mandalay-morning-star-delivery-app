/**
 * V2 Sprint 3: Tracking API Validation Schemas
 * Zod schemas for tracking API request/response validation
 */

import { z } from "zod";

// ===========================================
// ORDER STATUS
// ===========================================

export const orderStatusSchema = z.enum([
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
]);

// ===========================================
// ROUTE STOP STATUS
// ===========================================

export const routeStopStatusSchema = z.enum([
  "pending",
  "enroute",
  "arrived",
  "delivered",
  "skipped",
]);

// ===========================================
// VEHICLE TYPE
// ===========================================

export const vehicleTypeSchema = z.enum([
  "car",
  "motorcycle",
  "bicycle",
  "van",
  "truck",
]);

// ===========================================
// ADDRESS
// ===========================================

export const trackingAddressSchema = z.object({
  line1: z.string(),
  line2: z.string().nullable(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
});

// ===========================================
// ORDER ITEM
// ===========================================

export const trackingOrderItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  quantity: z.number().int().positive(),
  modifiers: z.array(z.string()),
});

// ===========================================
// ORDER INFO
// ===========================================

export const trackingOrderInfoSchema = z.object({
  id: z.string().uuid(),
  status: orderStatusSchema,
  placedAt: z.string().datetime(),
  confirmedAt: z.string().datetime().nullable(),
  deliveredAt: z.string().datetime().nullable(),
  deliveryWindowStart: z.string().datetime().nullable(),
  deliveryWindowEnd: z.string().datetime().nullable(),
  specialInstructions: z.string().nullable(),
  address: trackingAddressSchema,
  items: z.array(trackingOrderItemSchema),
  subtotalCents: z.number().int().nonnegative(),
  deliveryFeeCents: z.number().int().nonnegative(),
  taxCents: z.number().int().nonnegative(),
  totalCents: z.number().int().nonnegative(),
});

// ===========================================
// ROUTE STOP INFO
// ===========================================

export const trackingRouteStopInfoSchema = z.object({
  id: z.string().uuid(),
  stopIndex: z.number().int().nonnegative(),
  totalStops: z.number().int().positive(),
  currentStop: z.number().int().nonnegative(),
  status: routeStopStatusSchema,
  eta: z.string().datetime().nullable(),
  deliveryPhotoUrl: z.string().url().nullable(),
});

// ===========================================
// DRIVER INFO
// ===========================================

export const trackingDriverInfoSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().nullable(),
  profileImageUrl: z.string().url().nullable(),
  phone: z.string().nullable(),
});

export const trackingDriverDetailsSchema = trackingDriverInfoSchema.extend({
  vehicleType: vehicleTypeSchema.nullable(),
});

// ===========================================
// DRIVER LOCATION
// ===========================================

export const driverLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  recorded_at: z.string().datetime(),
  accuracy: z.number().nullable(),
  heading: z.number().min(0).max(360).nullable(),
});

// ===========================================
// ETA INFO
// ===========================================

export const etaInfoSchema = z.object({
  minMinutes: z.number().int().nonnegative(),
  maxMinutes: z.number().int().nonnegative(),
  estimatedArrival: z.string().datetime(),
});

// ===========================================
// FULL TRACKING DATA RESPONSE
// ===========================================

export const trackingDataSchema = z.object({
  order: trackingOrderInfoSchema,
  routeStop: trackingRouteStopInfoSchema.nullable(),
  driver: trackingDriverDetailsSchema.nullable(),
  driverLocation: driverLocationSchema.nullable(),
  eta: etaInfoSchema.nullable(),
});

// ===========================================
// API RESPONSE SCHEMA
// ===========================================

export const trackingApiResponseSchema = z.object({
  data: trackingDataSchema,
});

// ===========================================
// REALTIME UPDATE SCHEMAS
// ===========================================

export const realtimeOrderUpdateSchema = z.object({
  id: z.string().uuid(),
  status: orderStatusSchema,
  confirmed_at: z.string().datetime().nullable(),
  delivered_at: z.string().datetime().nullable(),
});

export const realtimeRouteStopUpdateSchema = z.object({
  id: z.string().uuid(),
  status: routeStopStatusSchema,
  eta: z.string().datetime().nullable(),
  stop_index: z.number().int().nonnegative(),
  arrived_at: z.string().datetime().nullable(),
  delivered_at: z.string().datetime().nullable(),
  delivery_photo_url: z.string().url().nullable(),
});

export const realtimeLocationUpdateSchema = z.object({
  id: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360).nullable(),
  accuracy: z.number().nullable(),
  recorded_at: z.string().datetime(),
});

// ===========================================
// REQUEST VALIDATION
// ===========================================

export const trackingParamsSchema = z.object({
  orderId: z.string().uuid(),
});

// ===========================================
// TYPE EXPORTS
// ===========================================

export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type RouteStopStatus = z.infer<typeof routeStopStatusSchema>;
export type TrackingData = z.infer<typeof trackingDataSchema>;
export type TrackingOrderInfo = z.infer<typeof trackingOrderInfoSchema>;
export type TrackingRouteStopInfo = z.infer<typeof trackingRouteStopInfoSchema>;
export type TrackingDriverDetails = z.infer<typeof trackingDriverDetailsSchema>;
export type DriverLocation = z.infer<typeof driverLocationSchema>;
export type EtaInfo = z.infer<typeof etaInfoSchema>;
