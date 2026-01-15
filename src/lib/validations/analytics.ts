/**
 * V2 Sprint 4: Analytics & Notifications Validation Schemas
 */

import { z } from "zod";

// ===========================================
// ENUMS
// ===========================================

export const notificationTypeSchema = z.enum([
  "order_confirmation",
  "out_for_delivery",
  "arriving_soon",
  "delivered",
  "feedback_request",
]);

export const notificationStatusSchema = z.enum([
  "pending",
  "sent",
  "delivered",
  "failed",
  "bounced",
]);

export const metricsPeriodSchema = z.enum(["day", "week", "month", "quarter"]);

export const deliveryExceptionTypeSchema = z.enum([
  "customer_not_home",
  "wrong_address",
  "access_issue",
  "refused_delivery",
  "damaged_order",
  "other",
]);

// ===========================================
// RATING SCHEMAS
// ===========================================

export const submitRatingSchema = z.object({
  rating: z
    .number()
    .int("Rating must be a whole number")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  feedbackText: z
    .string()
    .max(1000, "Feedback must be 1000 characters or less")
    .optional()
    .nullable(),
});

export const ratingQuerySchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
});

// ===========================================
// DRIVER ANALYTICS QUERY SCHEMAS
// ===========================================

export const driverAnalyticsQuerySchema = z.object({
  period: metricsPeriodSchema.optional(),
  includeInactive: z
    .string()
    .optional(),
}).transform((data) => ({
  period: data.period ?? "month",
  includeInactive: data.includeInactive === "true",
}));

export const driverIdParamSchema = z.object({
  driverId: z.string().uuid("Invalid driver ID"),
});

// ===========================================
// DELIVERY METRICS QUERY SCHEMAS
// ===========================================

export const deliveryMetricsQuerySchema = z.object({
  period: metricsPeriodSchema.optional().default("month"),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional(),
});

const parsedLimitSchema = z
  .string()
  .optional()
  .transform((val) => (val ? parseInt(val, 10) : 1000))
  .refine((val) => val > 0 && val <= 10000, {
    message: "Limit must be between 1 and 10000",
  });

export const heatmapQuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional(),
  limit: parsedLimitSchema,
});

// ===========================================
// NOTIFICATION SCHEMAS
// ===========================================

export const sendNotificationSchema = z.object({
  type: notificationTypeSchema,
  orderId: z.string().uuid("Invalid order ID"),
  metadata: z
    .object({
      driverName: z.string().optional(),
      driverPhone: z.string().optional(),
      vehicleType: z.string().optional(),
      etaMinutes: z.number().optional(),
      estimatedArrival: z.string().optional(),
      deliveryPhotoUrl: z.string().url().optional(),
      feedbackToken: z.string().optional(),
      trackingUrl: z.string().url().optional(),
      orderNumber: z.string().optional(),
    })
    .optional(),
});

export const notificationLogInsertSchema = z
  .object({
    order_id: z.string().uuid().optional().nullable(),
    user_id: z.string().uuid().optional().nullable(),
    notification_type: notificationTypeSchema,
    channel: z.string().optional(),
    recipient: z.string().min(1, "Recipient is required"),
    subject: z.string().optional().nullable(),
    resend_id: z.string().optional().nullable(),
    status: notificationStatusSchema.optional(),
    error_message: z.string().optional().nullable(),
    metadata: z.record(z.string(), z.unknown()).optional().nullable(),
    sent_at: z.string().optional().nullable(),
  })
  .transform((data) => ({
    ...data,
    channel: data.channel ?? "email",
    status: data.status ?? ("pending" as const),
  }));

// ===========================================
// RESPONSE VALIDATION SCHEMAS
// ===========================================

export const driverStatsSchema = z.object({
  driverId: z.string().uuid(),
  userId: z.string().uuid(),
  fullName: z.string().nullable(),
  email: z.string().email(),
  isActive: z.boolean(),
  vehicleType: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
  totalDeliveries: z.number(),
  deliveriesLast7Days: z.number(),
  deliveriesLast30Days: z.number(),
  onTimeRate: z.number(),
  avgDeliveryMinutes: z.number().nullable(),
  totalRatings: z.number(),
  avgRating: z.number().nullable(),
  ratingDistribution: z.object({
    fiveStar: z.number(),
    fourStar: z.number(),
    threeStar: z.number(),
    twoStar: z.number(),
    oneStar: z.number(),
  }),
  totalExceptions: z.number(),
  exceptionsByType: z.object({
    customerNotHome: z.number(),
    wrongAddress: z.number(),
    accessIssue: z.number(),
    refusedDelivery: z.number(),
    damagedOrder: z.number(),
  }),
  driverSince: z.string(),
  lastRouteCompleted: z.string().nullable(),
});

export const deliveryMetricsSchema = z.object({
  date: z.string(),
  totalOrders: z.number(),
  totalRevenueCents: z.number(),
  avgOrderCents: z.number(),
  deliveredCount: z.number(),
  skippedCount: z.number(),
  totalStops: z.number(),
  deliverySuccessRate: z.number(),
  etaAccuracyRate: z.number(),
  totalRoutes: z.number(),
  activeDrivers: z.number(),
  avgRouteDurationMinutes: z.number().nullable(),
  totalExceptions: z.number(),
});

// ===========================================
// TYPE EXPORTS
// ===========================================

export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type NotificationStatus = z.infer<typeof notificationStatusSchema>;
export type MetricsPeriod = z.infer<typeof metricsPeriodSchema>;
export type SubmitRatingInput = z.infer<typeof submitRatingSchema>;
export type DriverAnalyticsQuery = z.infer<typeof driverAnalyticsQuerySchema>;
export type DeliveryMetricsQuery = z.infer<typeof deliveryMetricsQuerySchema>;
export type HeatmapQuery = z.infer<typeof heatmapQuerySchema>;
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
export type NotificationLogInsert = z.infer<typeof notificationLogInsertSchema>;
