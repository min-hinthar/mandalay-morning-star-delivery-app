/**
 * Analytics Helpers - Trend Calculations
 * Percentage change, direction, and date range utilities
 */

import type { MetricsPeriod } from "@/types/analytics";

/**
 * Calculate percentage change between two values
 * @returns Percentage change (positive = increase, negative = decrease)
 */
export function calculateTrendPercentage(current: number, previous: number): number {
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
