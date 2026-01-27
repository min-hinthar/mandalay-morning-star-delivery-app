/**
 * Layout Components
 * V5 Foundation - Layout primitives and app shells
 *
 * NOTE: All components have moved to @/components/ui/layout
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

// App Shells (re-exported from ui/layout)
export {
  AdminLayout,
  DashboardGrid,
  KPIRow,
  MainArea,
  SideArea,
  FullWidthArea,
  CheckoutLayout,
  DriverLayout,
} from "@/components/ui/layout";
export type { CheckoutStep } from "@/types/checkout";
