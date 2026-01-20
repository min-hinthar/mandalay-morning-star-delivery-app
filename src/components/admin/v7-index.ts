/**
 * V7 Admin Components - Barrel Export
 *
 * Sprint 8: Admin Dashboard
 * Features: Animated KPIs, Recharts with transitions, drag-drop orders,
 * route optimization map, goal celebrations
 */

export { AdminDashboardV7 } from "./AdminDashboardV7";
export type { AdminDashboardV7Props, KPIData } from "./AdminDashboardV7";

export { ChartsV7, SparklineV7 } from "./analytics/ChartsV7";
export type {
  ChartsV7Props,
  SparklineV7Props,
  ChartDataPoint,
} from "./analytics/ChartsV7";

export { OrderManagementV7 } from "./OrderManagementV7";
export type {
  OrderManagementV7Props,
  OrderItemV7,
} from "./OrderManagementV7";

export { RouteOptimizationV7 } from "./RouteOptimizationV7";
export type {
  RouteOptimizationV7Props,
  RouteV7,
  RouteStopV7,
} from "./RouteOptimizationV7";

export {
  StatusCelebration,
  InlineCelebrationV7,
  useCelebration,
} from "./StatusCelebration";
export type {
  StatusCelebrationProps,
  InlineCelebrationV7Props,
  CelebrationConfig,
  CelebrationType,
} from "./StatusCelebration";
