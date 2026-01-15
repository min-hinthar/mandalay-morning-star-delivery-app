/**
 * V2 Sprint 4: Analytics & Notifications Types
 * Types for email notifications, driver performance analytics,
 * delivery metrics, and customer feedback
 */

import type { DeliveryExceptionType, VehicleType } from "./driver";

// ===========================================
// NOTIFICATION TYPES
// ===========================================

export type NotificationType =
  | "order_confirmation"
  | "out_for_delivery"
  | "arriving_soon"
  | "delivered"
  | "feedback_request";

export type NotificationStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "failed"
  | "bounced";

export type NotificationChannel = "email" | "sms" | "push";

export interface NotificationLogRow {
  id: string;
  order_id: string | null;
  user_id: string | null;
  notification_type: NotificationType;
  channel: string;
  recipient: string;
  subject: string | null;
  resend_id: string | null;
  status: NotificationStatus;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  sent_at: string | null;
  created_at: string;
}

export interface NotificationLogInsert {
  id?: string;
  order_id?: string | null;
  user_id?: string | null;
  notification_type: NotificationType;
  channel?: string;
  recipient: string;
  subject?: string | null;
  resend_id?: string | null;
  status?: NotificationStatus;
  error_message?: string | null;
  metadata?: Record<string, unknown> | null;
  sent_at?: string | null;
  created_at?: string;
}

export interface NotificationMetadata {
  driverName?: string;
  driverPhone?: string;
  vehicleType?: VehicleType;
  etaMinutes?: number;
  estimatedArrival?: string;
  deliveryPhotoUrl?: string;
  feedbackToken?: string;
  trackingUrl?: string;
  orderNumber?: string;
}

// ===========================================
// DRIVER RATINGS
// ===========================================

export interface DriverRatingRow {
  id: string;
  driver_id: string;
  order_id: string;
  route_stop_id: string | null;
  rating: number;
  feedback_text: string | null;
  submitted_at: string;
  created_at: string;
}

export interface DriverRatingInsert {
  driver_id: string;
  order_id: string;
  route_stop_id?: string | null;
  rating: number;
  feedback_text?: string | null;
}

export interface DriverRatingWithDetails extends DriverRatingRow {
  order: {
    id: string;
    delivery_window_start: string | null;
    total_cents: number;
  };
  customer: {
    full_name: string | null;
  } | null;
}

// ===========================================
// DRIVER PERFORMANCE STATS
// ===========================================

export interface DriverStats {
  driverId: string;
  userId: string;
  fullName: string | null;
  email: string;
  isActive: boolean;
  vehicleType: VehicleType | null;
  profileImageUrl: string | null;

  // Delivery counts
  totalDeliveries: number;
  deliveriesLast7Days: number;
  deliveriesLast30Days: number;

  // Performance
  onTimeRate: number;
  avgDeliveryMinutes: number | null;

  // Ratings
  totalRatings: number;
  avgRating: number | null;
  ratingDistribution: RatingDistribution;

  // Exceptions
  totalExceptions: number;
  exceptionsByType: ExceptionsByType;

  // Activity
  driverSince: string;
  lastRouteCompleted: string | null;
}

export interface RatingDistribution {
  fiveStar: number;
  fourStar: number;
  threeStar: number;
  twoStar: number;
  oneStar: number;
}

export interface ExceptionsByType {
  customerNotHome: number;
  wrongAddress: number;
  accessIssue: number;
  refusedDelivery: number;
  damagedOrder: number;
}

export interface DriverLeaderboardEntry {
  rank: number;
  driverId: string;
  fullName: string | null;
  profileImageUrl: string | null;
  totalDeliveries: number;
  avgRating: number | null;
  onTimeRate: number;
  trend: "up" | "down" | "stable";
}

export interface DriverStatsMvRow {
  driver_id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  is_active: boolean;
  vehicle_type: VehicleType | null;
  profile_image_url: string | null;
  total_deliveries: number;
  deliveries_last_7_days: number;
  deliveries_last_30_days: number;
  on_time_rate: number;
  avg_delivery_minutes: number | null;
  total_ratings: number;
  avg_rating: number | null;
  ratings_5_star: number;
  ratings_4_star: number;
  ratings_3_star: number;
  ratings_2_star: number;
  ratings_1_star: number;
  total_exceptions: number;
  exceptions_not_home: number;
  exceptions_wrong_address: number;
  exceptions_access: number;
  exceptions_refused: number;
  exceptions_damaged: number;
  driver_since: string;
  last_route_completed: string | null;
}

// ===========================================
// DELIVERY METRICS
// ===========================================

export interface DeliveryMetrics {
  date: string;
  totalOrders: number;
  totalRevenueCents: number;
  avgOrderCents: number;
  deliveredCount: number;
  skippedCount: number;
  totalStops: number;
  deliverySuccessRate: number;
  etaAccuracyRate: number;
  totalRoutes: number;
  activeDrivers: number;
  avgRouteDurationMinutes: number | null;
  totalExceptions: number;
}

export interface DeliveryMetricsMvRow {
  delivery_date: string;
  total_orders: number;
  total_revenue_cents: number;
  avg_order_cents: number;
  delivered_count: number;
  skipped_count: number;
  total_stops: number;
  delivery_success_rate: number;
  eta_accuracy_rate: number;
  total_routes: number;
  active_drivers: number;
  avg_route_duration_minutes: number | null;
  total_exceptions: number;
}

export type MetricsPeriod = "day" | "week" | "month" | "quarter";

export interface DeliveryMetricsSummary {
  period: MetricsPeriod;
  startDate: string;
  endDate: string;

  // Totals
  totalOrders: number;
  totalRevenueCents: number;
  avgOrderValueCents: number;
  totalDeliveries: number;
  totalSkipped: number;

  // Rates
  deliverySuccessRate: number;
  etaAccuracyRate: number;

  // Averages
  avgDailyOrders: number;
  avgDailyRevenue: number;
  avgRouteDuration: number | null;

  // Trends (percentage change from previous period)
  ordersTrend: number;
  revenueTrend: number;
  successRateTrend: number;

  // Exceptions breakdown
  totalExceptions: number;
  exceptionsByType: Record<DeliveryExceptionType, number>;
}

// ===========================================
// CHART DATA TYPES
// ===========================================

export interface DailyMetricPoint {
  date: string;
  value: number;
  label?: string;
}

export interface TimeSeriesData {
  labels: string[];
  datasets: TimeSeriesDataset[];
}

export interface TimeSeriesDataset {
  label: string;
  data: number[];
  color?: string;
  type?: "line" | "bar" | "area";
}

export interface HeatmapCell {
  lat: number;
  lng: number;
  weight: number;
}

export interface PeakHoursData {
  hour: number; // 0-23
  label: string; // "11 AM", "2 PM", etc.
  deliveryCount: number;
  avgDurationMinutes: number;
}

export interface RatingTrendPoint {
  date: string;
  avgRating: number;
  count: number;
}

// ===========================================
// API REQUEST TYPES
// ===========================================

export interface DriverAnalyticsQuery {
  period?: MetricsPeriod;
  includeInactive?: boolean;
}

export interface DeliveryMetricsQuery {
  period?: MetricsPeriod;
  startDate?: string;
  endDate?: string;
}

export interface SubmitRatingRequest {
  rating: number;
  feedbackText?: string;
}

// ===========================================
// API RESPONSE TYPES
// ===========================================

export interface DriverAnalyticsListResponse {
  drivers: DriverStats[];
  leaderboard: DriverLeaderboardEntry[];
  summary: DriverTeamSummary;
}

export interface DriverTeamSummary {
  totalActiveDrivers: number;
  totalInactiveDrivers: number;
  avgTeamRating: number | null;
  avgOnTimeRate: number;
  totalDeliveriesThisWeek: number;
  totalDeliveriesThisMonth: number;
}

export interface DriverAnalyticsDetailResponse {
  stats: DriverStats;
  recentDeliveries: RecentDelivery[];
  ratingHistory: RatingTrendPoint[];
  deliveryTrend: DailyMetricPoint[];
  recentRatings: DriverRatingWithDetails[];
}

export interface RecentDelivery {
  id: string;
  orderId: string;
  deliveredAt: string;
  deliveryDurationMinutes: number | null;
  rating: number | null;
  hasException: boolean;
  customerName: string | null;
  address: string;
}

export interface DeliveryDashboardResponse {
  summary: DeliveryMetricsSummary;
  dailyMetrics: DeliveryMetrics[];
  peakHours: PeakHoursData[];
  topDrivers: DriverLeaderboardEntry[];
  recentExceptions: RecentException[];
}

export interface CoverageHeatmapResponse {
  cells: HeatmapCell[];
  center: {
    lat: number;
    lng: number;
  };
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  totalDeliveries: number;
}

export interface RecentException {
  id: string;
  orderId: string;
  orderNumber: string;
  driverId: string;
  driverName: string | null;
  type: DeliveryExceptionType;
  description: string | null;
  createdAt: string;
  resolved: boolean;
  resolvedAt: string | null;
}

export interface SubmitRatingResponse {
  id: string;
  message: string;
}

// ===========================================
// UI COMPONENT PROPS
// ===========================================

export interface MetricCardProps {
  title: string;
  value: number | string;
  previousValue?: number;
  format?: "number" | "currency" | "percent" | "duration";
  icon?: React.ReactNode;
  trend?: "up" | "down" | "stable";
  trendValue?: number;
  loading?: boolean;
  color?: "saffron" | "jade" | "curry" | "charcoal";
}

export interface AnimatedCounterProps {
  value: number;
  duration?: number;
  format?: "number" | "currency" | "percent";
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

export interface PerformanceChartProps {
  data: DailyMetricPoint[];
  title: string;
  color?: string;
  type?: "line" | "bar" | "area";
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
}

export interface LeaderboardProps {
  entries: DriverLeaderboardEntry[];
  onDriverClick?: (driverId: string) => void;
  loading?: boolean;
  showMedals?: boolean;
}

export interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  showLabel?: boolean;
}

// ===========================================
// NOTIFICATION PAYLOAD TYPES (Edge Function)
// ===========================================

export interface SendNotificationPayload {
  type: NotificationType;
  orderId: string;
  metadata?: NotificationMetadata;
}

export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  resendId?: string;
  recipient?: string;
  error?: string;
}
