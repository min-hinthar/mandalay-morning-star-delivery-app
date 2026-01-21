/**
 * Admin Components - Barrel Export
 *
 * Sprint 8: Admin Dashboard
 * Features: Animated KPIs, Recharts with transitions, drag-drop orders,
 * route optimization map, goal celebrations
 */

export { AdminDashboard, AdminDashboard as AdminDashboardV7 } from "./AdminDashboard";
export type { AdminDashboardProps, AdminDashboardProps as AdminDashboardV7Props, KPIData } from "./AdminDashboard";

export { Charts, Charts as ChartsV7, Sparkline, Sparkline as SparklineV7 } from "./analytics/Charts";
export type {
  ChartsProps,
  ChartsProps as ChartsV7Props,
  SparklineProps,
  SparklineProps as SparklineV7Props,
  ChartDataPoint,
} from "./analytics/Charts";

export { OrderManagement, OrderManagement as OrderManagementV7 } from "./OrderManagement";
export type {
  OrderManagementProps,
  OrderManagementProps as OrderManagementV7Props,
  OrderItem,
  OrderItem as OrderItemV7,
} from "./OrderManagement";

export { RouteOptimization, RouteOptimization as RouteOptimizationV7 } from "./RouteOptimization";
export type {
  RouteOptimizationProps,
  RouteOptimizationProps as RouteOptimizationV7Props,
  Route,
  Route as RouteV7,
  RouteStop,
  RouteStop as RouteStopV7,
} from "./RouteOptimization";

export {
  StatusCelebration,
  InlineCelebrationV7,
  InlineCelebrationV7 as InlineCelebration,
  useCelebration,
} from "./StatusCelebration";
export type {
  StatusCelebrationProps,
  InlineCelebrationV7Props,
  InlineCelebrationV7Props as InlineCelebrationProps,
  CelebrationConfig,
  CelebrationType,
} from "./StatusCelebration";
