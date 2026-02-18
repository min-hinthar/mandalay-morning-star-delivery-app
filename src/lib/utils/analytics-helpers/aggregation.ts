/**
 * Analytics Helpers - Metrics Aggregation
 * Summary calculations, leaderboard, peak hours, and data points
 */

import type {
  DriverStats,
  DeliveryMetrics,
  DeliveryMetricsSummary,
  MetricsPeriod,
  DriverLeaderboardEntry,
  PeakHoursData,
  DailyMetricPoint,
  RatingDistribution,
  ExceptionsByType,
} from "@/types/analytics";

import { calculateTrendPercentage, getTrendDirection, getDateRangeForPeriod } from "./trends";
import { formatHourLabel } from "./formatting";

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
  const totalRevenueCents = metrics.reduce((sum, m) => sum + m.totalRevenueCents, 0);
  const totalDeliveries = metrics.reduce((sum, m) => sum + m.deliveredCount, 0);
  const totalSkipped = metrics.reduce((sum, m) => sum + m.skippedCount, 0);
  const totalExceptions = metrics.reduce((sum, m) => sum + m.totalExceptions, 0);

  const avgSuccessRate =
    metrics.reduce((sum, m) => sum + m.deliverySuccessRate, 0) / metrics.length;
  const avgEtaAccuracy = metrics.reduce((sum, m) => sum + m.etaAccuracyRate, 0) / metrics.length;

  const validDurations = metrics.filter((m) => m.avgRouteDurationMinutes !== null);
  const avgRouteDuration =
    validDurations.length > 0
      ? validDurations.reduce((sum, m) => sum + (m.avgRouteDurationMinutes || 0), 0) /
        validDurations.length
      : null;

  // Calculate trends if previous data available
  let ordersTrend = 0;
  let revenueTrend = 0;
  let successRateTrend = 0;

  if (previousMetrics && previousMetrics.length > 0) {
    const prevTotalOrders = previousMetrics.reduce((sum, m) => sum + m.totalOrders, 0);
    const prevTotalRevenue = previousMetrics.reduce((sum, m) => sum + m.totalRevenueCents, 0);
    const prevAvgSuccess =
      previousMetrics.reduce((sum, m) => sum + m.deliverySuccessRate, 0) / previousMetrics.length;

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
    avgOrderValueCents: totalOrders > 0 ? Math.round(totalRevenueCents / totalOrders) : 0,
    totalDeliveries,
    totalSkipped,
    deliverySuccessRate: Math.round(avgSuccessRate * 10) / 10,
    etaAccuracyRate: Math.round(avgEtaAccuracy * 10) / 10,
    avgDailyOrders: metrics.length > 0 ? Math.round(totalOrders / metrics.length) : 0,
    avgDailyRevenue: metrics.length > 0 ? Math.round(totalRevenueCents / metrics.length) : 0,
    avgRouteDuration: avgRouteDuration ? Math.round(avgRouteDuration * 10) / 10 : null,
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
export function getRatingPercentages(distribution: RatingDistribution): RatingDistribution {
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
