import { describe, it, expect } from "vitest";
import {
  submitRatingSchema,
  ratingQuerySchema,
  driverAnalyticsQuerySchema,
  deliveryMetricsQuerySchema,
  heatmapQuerySchema,
  sendNotificationSchema,
  notificationLogInsertSchema,
  notificationTypeSchema,
  notificationStatusSchema,
  metricsPeriodSchema,
} from "../analytics";

describe("Analytics Validation Schemas", () => {
  // ===========================================
  // RATING SCHEMAS
  // ===========================================
  describe("submitRatingSchema", () => {
    it("should accept valid rating (1-5)", () => {
      for (let rating = 1; rating <= 5; rating++) {
        const result = submitRatingSchema.safeParse({ rating });
        expect(result.success).toBe(true);
      }
    });

    it("should reject rating below 1", () => {
      const result = submitRatingSchema.safeParse({ rating: 0 });
      expect(result.success).toBe(false);
    });

    it("should reject rating above 5", () => {
      const result = submitRatingSchema.safeParse({ rating: 6 });
      expect(result.success).toBe(false);
    });

    it("should reject decimal ratings", () => {
      const result = submitRatingSchema.safeParse({ rating: 3.5 });
      expect(result.success).toBe(false);
    });

    it("should accept optional feedback text", () => {
      const result = submitRatingSchema.safeParse({
        rating: 5,
        feedbackText: "Great service!",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.feedbackText).toBe("Great service!");
      }
    });

    it("should accept null feedback text", () => {
      const result = submitRatingSchema.safeParse({
        rating: 4,
        feedbackText: null,
      });
      expect(result.success).toBe(true);
    });

    it("should reject feedback text over 1000 characters", () => {
      const longFeedback = "x".repeat(1001);
      const result = submitRatingSchema.safeParse({
        rating: 4,
        feedbackText: longFeedback,
      });
      expect(result.success).toBe(false);
    });

    it("should accept feedback text exactly 1000 characters", () => {
      const maxFeedback = "x".repeat(1000);
      const result = submitRatingSchema.safeParse({
        rating: 5,
        feedbackText: maxFeedback,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("ratingQuerySchema", () => {
    it("should accept valid UUID order ID", () => {
      const result = ratingQuerySchema.safeParse({
        orderId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID", () => {
      const result = ratingQuerySchema.safeParse({
        orderId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing order ID", () => {
      const result = ratingQuerySchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // ===========================================
  // DRIVER ANALYTICS QUERY SCHEMAS
  // ===========================================
  describe("driverAnalyticsQuerySchema", () => {
    it("should accept empty query with defaults", () => {
      const result = driverAnalyticsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.period).toBe("month");
        expect(result.data.includeInactive).toBe(false);
      }
    });

    it("should accept valid period values", () => {
      const periods = ["day", "week", "month", "quarter"];
      for (const period of periods) {
        const result = driverAnalyticsQuerySchema.safeParse({ period });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid period", () => {
      const result = driverAnalyticsQuerySchema.safeParse({ period: "year" });
      expect(result.success).toBe(false);
    });

    it("should transform includeInactive string to boolean", () => {
      const result = driverAnalyticsQuerySchema.safeParse({
        includeInactive: "true",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeInactive).toBe(true);
      }
    });

    it("should set includeInactive to false when not provided", () => {
      const result = driverAnalyticsQuerySchema.safeParse({
        period: "week",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeInactive).toBe(false);
      }
    });
  });

  // ===========================================
  // DELIVERY METRICS QUERY SCHEMAS
  // ===========================================
  describe("deliveryMetricsQuerySchema", () => {
    it("should accept empty query with default period", () => {
      const result = deliveryMetricsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.period).toBe("month");
      }
    });

    it("should accept valid date range", () => {
      const result = deliveryMetricsQuerySchema.safeParse({
        startDate: "2026-01-01",
        endDate: "2026-01-31",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid date format", () => {
      const result = deliveryMetricsQuerySchema.safeParse({
        startDate: "01-01-2026",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid date format with slash", () => {
      const result = deliveryMetricsQuerySchema.safeParse({
        startDate: "2026/01/01",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("heatmapQuerySchema", () => {
    it("should accept empty query with default limit", () => {
      const result = heatmapQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(1000);
      }
    });

    it("should transform limit string to number", () => {
      const result = heatmapQuerySchema.safeParse({ limit: "500" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(500);
      }
    });

    it("should reject limit above 10000", () => {
      const result = heatmapQuerySchema.safeParse({ limit: "10001" });
      expect(result.success).toBe(false);
    });

    it("should reject limit of 0", () => {
      const result = heatmapQuerySchema.safeParse({ limit: "0" });
      expect(result.success).toBe(false);
    });
  });

  // ===========================================
  // NOTIFICATION SCHEMAS
  // ===========================================
  describe("sendNotificationSchema", () => {
    it("should accept valid notification payload", () => {
      const result = sendNotificationSchema.safeParse({
        type: "out_for_delivery",
        orderId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("should accept all valid notification types", () => {
      const types = [
        "order_confirmation",
        "out_for_delivery",
        "arriving_soon",
        "delivered",
        "feedback_request",
      ];
      for (const type of types) {
        const result = sendNotificationSchema.safeParse({
          type,
          orderId: "550e8400-e29b-41d4-a716-446655440000",
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid notification type", () => {
      const result = sendNotificationSchema.safeParse({
        type: "invalid_type",
        orderId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(false);
    });

    it("should accept notification with metadata", () => {
      const result = sendNotificationSchema.safeParse({
        type: "out_for_delivery",
        orderId: "550e8400-e29b-41d4-a716-446655440000",
        metadata: {
          driverName: "John Doe",
          etaMinutes: 30,
          trackingUrl: "https://example.com/track/123",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid metadata URL", () => {
      const result = sendNotificationSchema.safeParse({
        type: "delivered",
        orderId: "550e8400-e29b-41d4-a716-446655440000",
        metadata: {
          deliveryPhotoUrl: "not-a-url",
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("notificationLogInsertSchema", () => {
    it("should accept valid notification log", () => {
      const result = notificationLogInsertSchema.safeParse({
        notification_type: "delivered",
        recipient: "customer@example.com",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.channel).toBe("email");
        expect(result.data.status).toBe("pending");
      }
    });

    it("should accept full notification log", () => {
      const result = notificationLogInsertSchema.safeParse({
        order_id: "550e8400-e29b-41d4-a716-446655440000",
        user_id: "550e8400-e29b-41d4-a716-446655440001",
        notification_type: "out_for_delivery",
        channel: "email",
        recipient: "customer@example.com",
        subject: "Your order is on the way!",
        resend_id: "re_abc123",
        status: "sent",
        metadata: { driverName: "John" },
        sent_at: "2026-01-15T10:00:00Z",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty recipient", () => {
      const result = notificationLogInsertSchema.safeParse({
        notification_type: "delivered",
        recipient: "",
      });
      expect(result.success).toBe(false);
    });
  });

  // ===========================================
  // ENUM SCHEMAS
  // ===========================================
  describe("notificationTypeSchema", () => {
    it("should accept all valid types", () => {
      const types = [
        "order_confirmation",
        "out_for_delivery",
        "arriving_soon",
        "delivered",
        "feedback_request",
      ];
      for (const type of types) {
        const result = notificationTypeSchema.safeParse(type);
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid type", () => {
      const result = notificationTypeSchema.safeParse("cancelled");
      expect(result.success).toBe(false);
    });
  });

  describe("notificationStatusSchema", () => {
    it("should accept all valid statuses", () => {
      const statuses = ["pending", "sent", "delivered", "failed", "bounced"];
      for (const status of statuses) {
        const result = notificationStatusSchema.safeParse(status);
        expect(result.success).toBe(true);
      }
    });
  });

  describe("metricsPeriodSchema", () => {
    it("should accept all valid periods", () => {
      const periods = ["day", "week", "month", "quarter"];
      for (const period of periods) {
        const result = metricsPeriodSchema.safeParse(period);
        expect(result.success).toBe(true);
      }
    });

    it("should reject year period", () => {
      const result = metricsPeriodSchema.safeParse("year");
      expect(result.success).toBe(false);
    });
  });
});
