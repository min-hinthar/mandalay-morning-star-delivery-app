/**
 * Layout Components
 * V5 Foundation - Layout primitives and app shells
 *
 * NOTE: Layout primitives have moved to @/components/ui/
 * This file re-exports them for backwards compatibility.
 */

// V5 Layout Primitives (re-exported from ui/)
export {
  Container,
  containerBreakpoints,
  Stack,
  Cluster,
  Grid,
  SafeArea,
  getSafeAreaInsets,
  safeAreaClasses,
} from "@/components/ui";
export type {
  ContainerProps,
  ContainerSize,
  StackProps,
  ClusterProps,
  GridProps,
  SafeAreaProps,
  SafeAreaEdge,
} from "@/components/ui";

// App Shells
export { CheckoutLayout } from "./CheckoutLayout";
export type { CheckoutStep } from "@/types/checkout";
export { DriverLayout } from "./DriverLayout";
export {
  AdminLayout,
  DashboardGrid,
  KPIRow,
  MainArea,
  SideArea,
  FullWidthArea,
} from "./AdminLayout";
