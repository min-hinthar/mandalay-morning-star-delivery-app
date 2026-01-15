/**
 * V2 Sprint 4: Analytics Helper Utilities
 * Functions for calculating trends, formatting metrics, and transforming data
 */

import type {
  DriverStats,
  DriverStatsMvRow,
  DeliveryMetrics,
  DeliveryMetricsMvRow,
  DeliveryMetricsSummary,
  MetricsPeriod,
  DriverLeaderboardEntry,
  PeakHoursData,
  DailyMetricPoint,
  RatingDistribution,
  ExceptionsByType,
} from "@/types/analytics";

// ===========================================
// DRIVER STATS TRANSFORMATION
// ===========================================

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

// ===========================================
// TREND CALCULATIONS
// ===========================================

/**
 * Calculate percentage change between two values
 * @returns Percentage change (positive = increase, negative = decrease)
 */
export function calculateTrendPercentage(
  current: number,
  previous: number
): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

/**
 * Determine trend direction
 */
export function getTrendDirection(
  current: number,
  previous: number,
  threshold: number = 0.5
): "up" | "down" | "stable" {
  const change = calculateTrendPercentage(current, previous);
  if (change > threshold) return "up";
  if (change < -threshold) return "down";
  return "stable";
}

/**
 * Get date range for a period
 */
export function getDateRangeForPeriod(period: MetricsPeriod): {
  startDate: Date;
  endDate: Date;
} {
  const now = new Date();
  const endDate = new Date(now);
  let startDate: Date;

  switch (period) {
    case "day":
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
      break;
    case "week":
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "month":
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "quarter":
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    default:
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
  }

  return { startDate, endDate };
}

/**
 * Get previous period date range for comparison
 */
export function getPreviousPeriodRange(period: MetricsPeriod): {
  startDate: Date;
  endDate: Date;
} {
  const { startDate, endDate } = getDateRangeForPeriod(period);
  const duration = endDate.getTime() - startDate.getTime();

  return {
    startDate: new Date(startDate.getTime() - duration),
    endDate: new Date(startDate.getTime() - 1),
  };
}

// ===========================================
// METRICS AGGREGATION
// ===========================================

/**
 * Calculate delivery metrics summary from daily data
 */
export function calculateMetricsSummary(
  metrics: DeliveryMetrics[],
  period: MetricsPeriod,
  previousMetrics?: DeliveryMetrics[]
): DeliveryMetricsSummary {
  if (metrics.length === 0) {
    return createEmptyMetricsSummary(period);
  }

  const totalOrders = metrics.reduce((sum, m) => sum + m.totalOrders, 0);
  const totalRevenueCents = metrics.reduce(
    (sum, m) => sum + m.totalRevenueCents,
    0
  );
  const totalDeliveries = metrics.reduce((sum, m) => sum + m.deliveredCount, 0);
  const totalSkipped = metrics.reduce((sum, m) => sum + m.skippedCount, 0);
  const totalExceptions = metrics.reduce((sum, m) => sum + m.totalExceptions, 0);

  const avgSuccessRate =
    metrics.reduce((sum, m) => sum + m.deliverySuccessRate, 0) / metrics.length;
  const avgEtaAccuracy =
    metrics.reduce((sum, m) => sum + m.etaAccuracyRate, 0) / metrics.length;

  const validDurations = metrics.filter((m) => m.avgRouteDurationMinutes !== null);
  const avgRouteDuration =
    validDurations.length > 0
      ? validDurations.reduce(
          (sum, m) => sum + (m.avgRouteDurationMinutes || 0),
          0
        ) / validDurations.length
      : null;

  // Calculate trends if previous data available
  let ordersTrend = 0;
  let revenueTrend = 0;
  let successRateTrend = 0;

  if (previousMetrics && previousMetrics.length > 0) {
    const prevTotalOrders = previousMetrics.reduce(
      (sum, m) => sum + m.totalOrders,
      0
    );
    const prevTotalRevenue = previousMetrics.reduce(
      (sum, m) => sum + m.totalRevenueCents,
      0
    );
    const prevAvgSuccess =
      previousMetrics.reduce((sum, m) => sum + m.deliverySuccessRate, 0) /
      previousMetrics.length;

    ordersTrend = calculateTrendPercentage(totalOrders, prevTotalOrders);
    revenueTrend = calculateTrendPercentage(totalRevenueCents, prevTotalRevenue);
    successRateTrend = calculateTrendPercentage(avgSuccessRate, prevAvgSuccess);
  }

  const { startDate, endDate } = getDateRangeForPeriod(period);

  return {
    period,
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    totalOrders,
    totalRevenueCents,
    avgOrderValueCents:
      totalOrders > 0 ? Math.round(totalRevenueCents / totalOrders) : 0,
    totalDeliveries,
    totalSkipped,
    deliverySuccessRate: Math.round(avgSuccessRate * 10) / 10,
    etaAccuracyRate: Math.round(avgEtaAccuracy * 10) / 10,
    avgDailyOrders:
      metrics.length > 0 ? Math.round(totalOrders / metrics.length) : 0,
    avgDailyRevenue:
      metrics.length > 0 ? Math.round(totalRevenueCents / metrics.length) : 0,
    avgRouteDuration: avgRouteDuration
      ? Math.round(avgRouteDuration * 10) / 10
      : null,
    ordersTrend,
    revenueTrend,
    successRateTrend,
    totalExceptions,
    exceptionsByType: {
      customer_not_home: 0,
      wrong_address: 0,
      access_issue: 0,
      refused_delivery: 0,
      damaged_order: 0,
      other: 0,
    },
  };
}

function createEmptyMetricsSummary(period: MetricsPeriod): DeliveryMetricsSummary {
  const { startDate, endDate } = getDateRangeForPeriod(period);
  return {
    period,
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    totalOrders: 0,
    totalRevenueCents: 0,
    avgOrderValueCents: 0,
    totalDeliveries: 0,
    totalSkipped: 0,
    deliverySuccessRate: 0,
    etaAccuracyRate: 0,
    avgDailyOrders: 0,
    avgDailyRevenue: 0,
    avgRouteDuration: null,
    ordersTrend: 0,
    revenueTrend: 0,
    successRateTrend: 0,
    totalExceptions: 0,
    exceptionsByType: {
      customer_not_home: 0,
      wrong_address: 0,
      access_issue: 0,
      refused_delivery: 0,
      damaged_order: 0,
      other: 0,
    },
  };
}

// ===========================================
// LEADERBOARD
// ===========================================

/**
 * Generate driver leaderboard from stats
 */
export function generateLeaderboard(
  drivers: DriverStats[],
  limit: number = 10
): DriverLeaderboardEntry[] {
  // Sort by composite score: weighted combination of deliveries, rating, and on-time rate
  const scored = drivers
    .filter((d) => d.isActive && d.totalDeliveries > 0)
    .map((d) => ({
      ...d,
      score: calculateDriverScore(d),
    }))
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((d, index) => ({
    rank: index + 1,
    driverId: d.driverId,
    fullName: d.fullName,
    profileImageUrl: d.profileImageUrl,
    totalDeliveries: d.totalDeliveries,
    avgRating: d.avgRating,
    onTimeRate: d.onTimeRate,
    trend: getTrendDirection(d.deliveriesLast7Days, d.deliveriesLast30Days / 4),
  }));
}

/**
 * Calculate composite driver score for ranking
 */
export function calculateDriverScore(driver: DriverStats): number {
  // Weights: Deliveries (30%), Rating (40%), On-time (30%)
  const deliveryScore = Math.min(driver.totalDeliveries / 100, 1) * 30;
  const ratingScore = ((driver.avgRating || 3) / 5) * 40;
  const onTimeScore = (driver.onTimeRate / 100) * 30;

  return deliveryScore + ratingScore + onTimeScore;
}

// ===========================================
// PEAK HOURS
// ===========================================

/**
 * Calculate peak hours from delivery data
 */
export function calculatePeakHours(
  deliveries: Array<{ deliveredAt: string; durationMinutes: number | null }>
): PeakHoursData[] {
  const hourBuckets = new Map<
    number,
    { count: number; totalDuration: number; durationCount: number }
  >();

  // Initialize buckets for delivery hours (11 AM - 7 PM)
  for (let hour = 11; hour <= 19; hour++) {
    hourBuckets.set(hour, { count: 0, totalDuration: 0, durationCount: 0 });
  }

  for (const delivery of deliveries) {
    const date = new Date(delivery.deliveredAt);
    const hour = date.getHours();

    if (hour >= 11 && hour <= 19) {
      const bucket = hourBuckets.get(hour)!;
      bucket.count++;
      if (delivery.durationMinutes !== null) {
        bucket.totalDuration += delivery.durationMinutes;
        bucket.durationCount++;
      }
    }
  }

  return Array.from(hourBuckets.entries())
    .map(([hour, data]) => ({
      hour,
      label: formatHourLabel(hour),
      deliveryCount: data.count,
      avgDurationMinutes:
        data.durationCount > 0
          ? Math.round((data.totalDuration / data.durationCount) * 10) / 10
          : 0,
    }))
    .sort((a, b) => a.hour - b.hour);
}

/**
 * Format hour to readable label (e.g., "2 PM")
 */
export function formatHourLabel(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour} ${period}`;
}

// ===========================================
// FORMATTING HELPERS
// ===========================================

/**
 * Format cents to currency string
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format duration in minutes to readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Format number with thousands separators
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Format rating to display string
 */
export function formatRating(rating: number | null): string {
  if (rating === null) return "N/A";
  return rating.toFixed(1);
}

// ===========================================
// DATA POINT GENERATION
// ===========================================

/**
 * Convert metrics to chart-friendly data points
 */
export function metricsToDataPoints(
  metrics: DeliveryMetrics[],
  field: keyof DeliveryMetrics
): DailyMetricPoint[] {
  return metrics.map((m) => ({
    date: m.date,
    value: Number(m[field]) || 0,
  }));
}

/**
 * Get rating distribution as percentages
 */
export function getRatingPercentages(
  distribution: RatingDistribution
): RatingDistribution {
  const total =
    distribution.fiveStar +
    distribution.fourStar +
    distribution.threeStar +
    distribution.twoStar +
    distribution.oneStar;

  if (total === 0) {
    return { fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0 };
  }

  return {
    fiveStar: Math.round((distribution.fiveStar / total) * 100),
    fourStar: Math.round((distribution.fourStar / total) * 100),
    threeStar: Math.round((distribution.threeStar / total) * 100),
    twoStar: Math.round((distribution.twoStar / total) * 100),
    oneStar: Math.round((distribution.oneStar / total) * 100),
  };
}

/**
 * Get total exceptions from breakdown
 */
export function getTotalExceptions(exceptions: ExceptionsByType): number {
  return (
    exceptions.customerNotHome +
    exceptions.wrongAddress +
    exceptions.accessIssue +
    exceptions.refusedDelivery +
    exceptions.damagedOrder
  );
}
