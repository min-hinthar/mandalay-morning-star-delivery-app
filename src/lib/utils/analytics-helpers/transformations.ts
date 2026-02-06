/**
 * Analytics Helpers - Data Transformations
 * Transform database rows to typed objects
 */

import type {
  DriverStats,
  DriverStatsMvRow,
  DeliveryMetrics,
  DeliveryMetricsMvRow,
} from "@/types/analytics";

/**
 * Transform database row to DriverStats type
 */
export function transformDriverStats(row: DriverStatsMvRow): DriverStats {
  return {
    driverId: row.driver_id,
    userId: row.user_id,
    fullName: row.full_name,
    email: row.email,
    isActive: row.is_active,
    vehicleType: row.vehicle_type,
    profileImageUrl: row.profile_image_url,
    totalDeliveries: Number(row.total_deliveries) || 0,
    deliveriesLast7Days: Number(row.deliveries_last_7_days) || 0,
    deliveriesLast30Days: Number(row.deliveries_last_30_days) || 0,
    onTimeRate: Number(row.on_time_rate) || 0,
    avgDeliveryMinutes: row.avg_delivery_minutes
      ? Number(row.avg_delivery_minutes)
      : null,
    totalRatings: Number(row.total_ratings) || 0,
    avgRating: row.avg_rating ? Number(row.avg_rating) : null,
    ratingDistribution: {
      fiveStar: Number(row.ratings_5_star) || 0,
      fourStar: Number(row.ratings_4_star) || 0,
      threeStar: Number(row.ratings_3_star) || 0,
      twoStar: Number(row.ratings_2_star) || 0,
      oneStar: Number(row.ratings_1_star) || 0,
    },
    totalExceptions: Number(row.total_exceptions) || 0,
    exceptionsByType: {
      customerNotHome: Number(row.exceptions_not_home) || 0,
      wrongAddress: Number(row.exceptions_wrong_address) || 0,
      accessIssue: Number(row.exceptions_access) || 0,
      refusedDelivery: Number(row.exceptions_refused) || 0,
      damagedOrder: Number(row.exceptions_damaged) || 0,
    },
    driverSince: row.driver_since,
    lastRouteCompleted: row.last_route_completed,
  };
}

/**
 * Transform database row to DeliveryMetrics type
 */
export function transformDeliveryMetrics(
  row: DeliveryMetricsMvRow
): DeliveryMetrics {
  return {
    date: row.delivery_date,
    totalOrders: Number(row.total_orders) || 0,
    totalRevenueCents: Number(row.total_revenue_cents) || 0,
    avgOrderCents: Number(row.avg_order_cents) || 0,
    deliveredCount: Number(row.delivered_count) || 0,
    skippedCount: Number(row.skipped_count) || 0,
    totalStops: Number(row.total_stops) || 0,
    deliverySuccessRate: Number(row.delivery_success_rate) || 0,
    etaAccuracyRate: Number(row.eta_accuracy_rate) || 0,
    totalRoutes: Number(row.total_routes) || 0,
    activeDrivers: Number(row.active_drivers) || 0,
    avgRouteDurationMinutes: row.avg_route_duration_minutes
      ? Number(row.avg_route_duration_minutes)
      : null,
    totalExceptions: Number(row.total_exceptions) || 0,
  };
}
