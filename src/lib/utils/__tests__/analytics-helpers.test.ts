import { describe, it, expect } from "vitest";
import {
  calculateTrendPercentage,
  getTrendDirection,
  getDateRangeForPeriod,
  generateLeaderboard,
  calculateDriverScore,
  calculatePeakHours,
  formatHourLabel,
  formatCurrency,
  formatPercent,
  formatDuration,
  formatNumber,
  formatRating,
  getRatingPercentages,
  getTotalExceptions,
  transformDriverStats,
  transformDeliveryMetrics,
  calculateMetricsSummary,
  metricsToDataPoints,
} from "../analytics-helpers";
import type {
  DriverStats,
  DriverStatsMvRow,
  DeliveryMetrics,
  DeliveryMetricsMvRow,
  RatingDistribution,
  ExceptionsByType,
} from "@/types/analytics";

describe("Analytics Helpers", () => {
  // ===========================================
  // TREND CALCULATIONS
  // ===========================================
  describe("calculateTrendPercentage", () => {
    it("should calculate positive trend correctly", () => {
      expect(calculateTrendPercentage(120, 100)).toBe(20);
    });

    it("should calculate negative trend correctly", () => {
      expect(calculateTrendPercentage(80, 100)).toBe(-20);
    });

    it("should handle zero previous value", () => {
      expect(calculateTrendPercentage(100, 0)).toBe(100);
      expect(calculateTrendPercentage(0, 0)).toBe(0);
    });

    it("should round to one decimal place", () => {
      expect(calculateTrendPercentage(133, 100)).toBe(33);
      expect(calculateTrendPercentage(1333, 1000)).toBe(33.3);
    });

    it("should handle equal values", () => {
      expect(calculateTrendPercentage(100, 100)).toBe(0);
    });
  });

  describe("getTrendDirection", () => {
    it("should return up for positive change above threshold", () => {
      expect(getTrendDirection(110, 100)).toBe("up");
    });

    it("should return down for negative change below threshold", () => {
      expect(getTrendDirection(90, 100)).toBe("down");
    });

    it("should return stable for small changes", () => {
      expect(getTrendDirection(100.3, 100)).toBe("stable");
      expect(getTrendDirection(99.7, 100)).toBe("stable");
    });

    it("should respect custom threshold", () => {
      expect(getTrendDirection(101, 100, 2)).toBe("stable");
      expect(getTrendDirection(103, 100, 2)).toBe("up");
    });
  });

  describe("getDateRangeForPeriod", () => {
    it("should return 1 day range for day period", () => {
      const { startDate, endDate } = getDateRangeForPeriod("day");
      const diff = endDate.getTime() - startDate.getTime();
      const dayInMs = 24 * 60 * 60 * 1000;
      expect(diff).toBeCloseTo(dayInMs, -3);
    });

    it("should return 7 day range for week period", () => {
      const { startDate, endDate } = getDateRangeForPeriod("week");
      const diff = endDate.getTime() - startDate.getTime();
      const weekInMs = 7 * 24 * 60 * 60 * 1000;
      expect(diff).toBeCloseTo(weekInMs, -3);
    });

    it("should return approximately 30 day range for month period", () => {
      const { startDate, endDate } = getDateRangeForPeriod("month");
      const diff = endDate.getTime() - startDate.getTime();
      const monthInMs = 28 * 24 * 60 * 60 * 1000; // at least 28 days
      expect(diff).toBeGreaterThanOrEqual(monthInMs);
    });
  });

  // ===========================================
  // LEADERBOARD
  // ===========================================
  describe("generateLeaderboard", () => {
    const mockDrivers: DriverStats[] = [
      createMockDriverStats({
        driverId: "d1",
        fullName: "Top Driver",
        totalDeliveries: 100,
        avgRating: 4.9,
        onTimeRate: 95,
        isActive: true,
      }),
      createMockDriverStats({
        driverId: "d2",
        fullName: "Good Driver",
        totalDeliveries: 80,
        avgRating: 4.5,
        onTimeRate: 88,
        isActive: true,
      }),
      createMockDriverStats({
        driverId: "d3",
        fullName: "Inactive Driver",
        totalDeliveries: 50,
        avgRating: 4.0,
        onTimeRate: 80,
        isActive: false,
      }),
    ];

    it("should rank drivers by composite score", () => {
      const leaderboard = generateLeaderboard(mockDrivers);
      expect(leaderboard[0].fullName).toBe("Top Driver");
      expect(leaderboard[1].fullName).toBe("Good Driver");
    });

    it("should exclude inactive drivers", () => {
      const leaderboard = generateLeaderboard(mockDrivers);
      expect(leaderboard.length).toBe(2);
      expect(leaderboard.find((d) => d.fullName === "Inactive Driver")).toBeUndefined();
    });

    it("should assign correct ranks", () => {
      const leaderboard = generateLeaderboard(mockDrivers);
      expect(leaderboard[0].rank).toBe(1);
      expect(leaderboard[1].rank).toBe(2);
    });

    it("should limit results to specified count", () => {
      const leaderboard = generateLeaderboard(mockDrivers, 1);
      expect(leaderboard.length).toBe(1);
    });

    it("should exclude drivers with zero deliveries", () => {
      const driversWithZero = [
        ...mockDrivers,
        createMockDriverStats({
          driverId: "d4",
          fullName: "New Driver",
          totalDeliveries: 0,
          isActive: true,
        }),
      ];
      const leaderboard = generateLeaderboard(driversWithZero);
      expect(leaderboard.find((d) => d.fullName === "New Driver")).toBeUndefined();
    });
  });

  describe("calculateDriverScore", () => {
    it("should return higher score for better performance", () => {
      const topDriver = createMockDriverStats({
        totalDeliveries: 100,
        avgRating: 5,
        onTimeRate: 100,
      });
      const avgDriver = createMockDriverStats({
        totalDeliveries: 50,
        avgRating: 3,
        onTimeRate: 75,
      });

      expect(calculateDriverScore(topDriver)).toBeGreaterThan(
        calculateDriverScore(avgDriver)
      );
    });

    it("should cap delivery score at 100 deliveries", () => {
      const driver100 = createMockDriverStats({ totalDeliveries: 100 });
      const driver200 = createMockDriverStats({ totalDeliveries: 200 });

      // Both should have same delivery component since it caps at 100
      const score100 = calculateDriverScore(driver100);
      const score200 = calculateDriverScore(driver200);
      expect(score100).toBe(score200);
    });

    it("should use default rating of 3 when null", () => {
      const driverWithRating = createMockDriverStats({ avgRating: 3 });
      const driverWithoutRating = createMockDriverStats({ avgRating: null });

      expect(calculateDriverScore(driverWithRating)).toBe(
        calculateDriverScore(driverWithoutRating)
      );
    });
  });

  // ===========================================
  // PEAK HOURS
  // ===========================================
  describe("calculatePeakHours", () => {
    // Helper to create local time strings (avoids timezone issues)
    const createLocalDateTime = (hour: number, minute: number = 0): string => {
      const date = new Date(2026, 0, 15, hour, minute, 0);
      return date.toISOString();
    };

    it("should bucket deliveries by hour", () => {
      const deliveries = [
        { deliveredAt: createLocalDateTime(14, 30), durationMinutes: 10 },
        { deliveredAt: createLocalDateTime(14, 45), durationMinutes: 15 },
        { deliveredAt: createLocalDateTime(15, 0), durationMinutes: 12 },
      ];

      const peakHours = calculatePeakHours(deliveries);
      const hour14 = peakHours.find((h) => h.hour === 14);
      const hour15 = peakHours.find((h) => h.hour === 15);

      expect(hour14?.deliveryCount).toBe(2);
      expect(hour15?.deliveryCount).toBe(1);
    });

    it("should calculate average duration per hour", () => {
      const deliveries = [
        { deliveredAt: createLocalDateTime(14, 30), durationMinutes: 10 },
        { deliveredAt: createLocalDateTime(14, 45), durationMinutes: 20 },
      ];

      const peakHours = calculatePeakHours(deliveries);
      const hour14 = peakHours.find((h) => h.hour === 14);

      expect(hour14?.avgDurationMinutes).toBe(15);
    });

    it("should only include delivery hours (11 AM - 7 PM)", () => {
      const peakHours = calculatePeakHours([]);
      expect(peakHours.length).toBe(9); // 11-19 inclusive
      expect(peakHours[0].hour).toBe(11);
      expect(peakHours[8].hour).toBe(19);
    });

    it("should handle null duration", () => {
      const deliveries = [
        { deliveredAt: createLocalDateTime(14, 30), durationMinutes: null },
      ];

      const peakHours = calculatePeakHours(deliveries);
      const hour14 = peakHours.find((h) => h.hour === 14);

      expect(hour14?.deliveryCount).toBe(1);
      expect(hour14?.avgDurationMinutes).toBe(0);
    });

    it("should ignore deliveries outside business hours", () => {
      const deliveries = [
        { deliveredAt: createLocalDateTime(10, 0), durationMinutes: 5 }, // Before 11 AM
        { deliveredAt: createLocalDateTime(20, 0), durationMinutes: 5 }, // After 7 PM
        { deliveredAt: createLocalDateTime(14, 0), durationMinutes: 5 }, // Valid
      ];

      const peakHours = calculatePeakHours(deliveries);
      const totalDeliveries = peakHours.reduce((sum, h) => sum + h.deliveryCount, 0);

      expect(totalDeliveries).toBe(1);
    });
  });

  describe("formatHourLabel", () => {
    it("should format AM hours correctly", () => {
      expect(formatHourLabel(11)).toBe("11 AM");
    });

    it("should format PM hours correctly", () => {
      expect(formatHourLabel(14)).toBe("2 PM");
      expect(formatHourLabel(19)).toBe("7 PM");
    });

    it("should format noon correctly", () => {
      expect(formatHourLabel(12)).toBe("12 PM");
    });
  });

  // ===========================================
  // FORMATTING HELPERS
  // ===========================================
  describe("formatCurrency", () => {
    it("should format cents to dollars", () => {
      expect(formatCurrency(1000)).toBe("$10.00");
      expect(formatCurrency(1599)).toBe("$15.99");
      expect(formatCurrency(50)).toBe("$0.50");
    });

    it("should handle zero", () => {
      expect(formatCurrency(0)).toBe("$0.00");
    });
  });

  describe("formatPercent", () => {
    it("should format with default 1 decimal", () => {
      expect(formatPercent(95.5)).toBe("95.5%");
      expect(formatPercent(100)).toBe("100.0%");
    });

    it("should respect decimal parameter", () => {
      expect(formatPercent(95.567, 2)).toBe("95.57%");
      expect(formatPercent(95.5, 0)).toBe("96%");
    });
  });

  describe("formatDuration", () => {
    it("should format minutes under 60", () => {
      expect(formatDuration(45)).toBe("45 min");
      expect(formatDuration(5)).toBe("5 min");
    });

    it("should format hours", () => {
      expect(formatDuration(60)).toBe("1h");
      expect(formatDuration(120)).toBe("2h");
    });

    it("should format hours and minutes", () => {
      expect(formatDuration(90)).toBe("1h 30m");
      expect(formatDuration(125)).toBe("2h 5m");
    });
  });

  describe("formatNumber", () => {
    it("should add thousands separators", () => {
      expect(formatNumber(1000)).toBe("1,000");
      expect(formatNumber(1000000)).toBe("1,000,000");
    });

    it("should handle small numbers", () => {
      expect(formatNumber(42)).toBe("42");
    });
  });

  describe("formatRating", () => {
    it("should format rating to 1 decimal", () => {
      expect(formatRating(4.5)).toBe("4.5");
      expect(formatRating(5)).toBe("5.0");
    });

    it("should return N/A for null", () => {
      expect(formatRating(null)).toBe("N/A");
    });
  });

  // ===========================================
  // RATING & EXCEPTION HELPERS
  // ===========================================
  describe("getRatingPercentages", () => {
    it("should calculate percentages correctly", () => {
      const distribution: RatingDistribution = {
        fiveStar: 50,
        fourStar: 30,
        threeStar: 10,
        twoStar: 5,
        oneStar: 5,
      };

      const percentages = getRatingPercentages(distribution);
      expect(percentages.fiveStar).toBe(50);
      expect(percentages.fourStar).toBe(30);
      expect(percentages.threeStar).toBe(10);
      expect(percentages.twoStar).toBe(5);
      expect(percentages.oneStar).toBe(5);
    });

    it("should handle all zeros", () => {
      const distribution: RatingDistribution = {
        fiveStar: 0,
        fourStar: 0,
        threeStar: 0,
        twoStar: 0,
        oneStar: 0,
      };

      const percentages = getRatingPercentages(distribution);
      expect(percentages.fiveStar).toBe(0);
    });
  });

  describe("getTotalExceptions", () => {
    it("should sum all exception types", () => {
      const exceptions: ExceptionsByType = {
        customerNotHome: 5,
        wrongAddress: 3,
        accessIssue: 2,
        refusedDelivery: 1,
        damagedOrder: 1,
      };

      expect(getTotalExceptions(exceptions)).toBe(12);
    });

    it("should return zero for empty exceptions", () => {
      const exceptions: ExceptionsByType = {
        customerNotHome: 0,
        wrongAddress: 0,
        accessIssue: 0,
        refusedDelivery: 0,
        damagedOrder: 0,
      };

      expect(getTotalExceptions(exceptions)).toBe(0);
    });
  });

  // ===========================================
  // TRANSFORMATION
  // ===========================================
  describe("transformDriverStats", () => {
    it("should transform database row correctly", () => {
      const row: DriverStatsMvRow = {
        driver_id: "d1",
        user_id: "u1",
        full_name: "John Doe",
        email: "john@example.com",
        is_active: true,
        vehicle_type: "car",
        profile_image_url: null,
        total_deliveries: 100,
        deliveries_last_7_days: 10,
        deliveries_last_30_days: 40,
        on_time_rate: 95.5,
        avg_delivery_minutes: 12.3,
        total_ratings: 50,
        avg_rating: 4.8,
        ratings_5_star: 30,
        ratings_4_star: 15,
        ratings_3_star: 5,
        ratings_2_star: 0,
        ratings_1_star: 0,
        total_exceptions: 3,
        exceptions_not_home: 2,
        exceptions_wrong_address: 1,
        exceptions_access: 0,
        exceptions_refused: 0,
        exceptions_damaged: 0,
        driver_since: "2025-01-01T00:00:00Z",
        last_route_completed: "2026-01-15T18:00:00Z",
      };

      const stats = transformDriverStats(row);

      expect(stats.driverId).toBe("d1");
      expect(stats.fullName).toBe("John Doe");
      expect(stats.totalDeliveries).toBe(100);
      expect(stats.onTimeRate).toBe(95.5);
      expect(stats.avgRating).toBe(4.8);
      expect(stats.ratingDistribution.fiveStar).toBe(30);
      expect(stats.exceptionsByType.customerNotHome).toBe(2);
    });
  });

  describe("transformDeliveryMetrics", () => {
    it("should transform database row correctly", () => {
      const row: DeliveryMetricsMvRow = {
        delivery_date: "2026-01-15",
        total_orders: 50,
        total_revenue_cents: 500000,
        avg_order_cents: 10000,
        delivered_count: 48,
        skipped_count: 2,
        total_stops: 50,
        delivery_success_rate: 96,
        eta_accuracy_rate: 88.5,
        total_routes: 5,
        active_drivers: 3,
        avg_route_duration_minutes: 120.5,
        total_exceptions: 2,
      };

      const metrics = transformDeliveryMetrics(row);

      expect(metrics.date).toBe("2026-01-15");
      expect(metrics.totalOrders).toBe(50);
      expect(metrics.totalRevenueCents).toBe(500000);
      expect(metrics.deliverySuccessRate).toBe(96);
      expect(metrics.avgRouteDurationMinutes).toBe(120.5);
    });
  });

  describe("metricsToDataPoints", () => {
    it("should convert metrics to chart data", () => {
      const metrics: DeliveryMetrics[] = [
        createMockDeliveryMetrics({ date: "2026-01-13", totalOrders: 30 }),
        createMockDeliveryMetrics({ date: "2026-01-14", totalOrders: 40 }),
        createMockDeliveryMetrics({ date: "2026-01-15", totalOrders: 50 }),
      ];

      const dataPoints = metricsToDataPoints(metrics, "totalOrders");

      expect(dataPoints.length).toBe(3);
      expect(dataPoints[0]).toEqual({ date: "2026-01-13", value: 30 });
      expect(dataPoints[2]).toEqual({ date: "2026-01-15", value: 50 });
    });
  });

  describe("calculateMetricsSummary", () => {
    it("should calculate summary from daily metrics", () => {
      const metrics: DeliveryMetrics[] = [
        createMockDeliveryMetrics({
          date: "2026-01-13",
          totalOrders: 30,
          totalRevenueCents: 300000,
          deliverySuccessRate: 90,
        }),
        createMockDeliveryMetrics({
          date: "2026-01-14",
          totalOrders: 40,
          totalRevenueCents: 400000,
          deliverySuccessRate: 95,
        }),
      ];

      const summary = calculateMetricsSummary(metrics, "week");

      expect(summary.totalOrders).toBe(70);
      expect(summary.totalRevenueCents).toBe(700000);
      expect(summary.deliverySuccessRate).toBe(92.5);
    });

    it("should handle empty metrics", () => {
      const summary = calculateMetricsSummary([], "week");
      expect(summary.totalOrders).toBe(0);
      expect(summary.totalRevenueCents).toBe(0);
    });

    it("should calculate trends when previous data provided", () => {
      const currentMetrics: DeliveryMetrics[] = [
        createMockDeliveryMetrics({ totalOrders: 100, totalRevenueCents: 1000000 }),
      ];
      const previousMetrics: DeliveryMetrics[] = [
        createMockDeliveryMetrics({ totalOrders: 80, totalRevenueCents: 800000 }),
      ];

      const summary = calculateMetricsSummary(currentMetrics, "week", previousMetrics);

      expect(summary.ordersTrend).toBe(25); // (100-80)/80 * 100
      expect(summary.revenueTrend).toBe(25);
    });
  });
});

// ===========================================
// TEST HELPERS
// ===========================================

function createMockDriverStats(
  overrides: Partial<DriverStats> = {}
): DriverStats {
  return {
    driverId: "default-id",
    userId: "user-id",
    fullName: "Default Driver",
    email: "driver@example.com",
    isActive: true,
    vehicleType: "car",
    profileImageUrl: null,
    totalDeliveries: 50,
    deliveriesLast7Days: 10,
    deliveriesLast30Days: 40,
    onTimeRate: 85,
    avgDeliveryMinutes: 15,
    totalRatings: 20,
    avgRating: 4.5,
    ratingDistribution: {
      fiveStar: 10,
      fourStar: 7,
      threeStar: 3,
      twoStar: 0,
      oneStar: 0,
    },
    totalExceptions: 2,
    exceptionsByType: {
      customerNotHome: 1,
      wrongAddress: 1,
      accessIssue: 0,
      refusedDelivery: 0,
      damagedOrder: 0,
    },
    driverSince: "2025-01-01T00:00:00Z",
    lastRouteCompleted: "2026-01-15T18:00:00Z",
    ...overrides,
  };
}

function createMockDeliveryMetrics(
  overrides: Partial<DeliveryMetrics> = {}
): DeliveryMetrics {
  return {
    date: "2026-01-15",
    totalOrders: 50,
    totalRevenueCents: 500000,
    avgOrderCents: 10000,
    deliveredCount: 48,
    skippedCount: 2,
    totalStops: 50,
    deliverySuccessRate: 96,
    etaAccuracyRate: 88,
    totalRoutes: 5,
    activeDrivers: 3,
    avgRouteDurationMinutes: 120,
    totalExceptions: 2,
    ...overrides,
  };
}
