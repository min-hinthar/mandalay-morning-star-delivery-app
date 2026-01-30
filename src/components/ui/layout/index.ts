/**
 * Layout Components
 *
 * App shells, headers, and layout utilities for the application.
 */

// ============================================
// APP SHELLS
// ============================================

export { AdminLayout, DashboardGrid, KPIRow, MainArea, SideArea, FullWidthArea } from "./AdminLayout";

export type { CheckoutStep } from "@/types/checkout";

export { DriverLayout } from "./DriverLayout";

// ============================================
// HEADER COMPONENTS
// ============================================

export { AppHeader, HeaderSpacer } from "./AppHeader";
export type { AppHeaderProps } from "./AppHeader";

export { DesktopHeader, defaultNavItems } from "./AppHeader/DesktopHeader";
export type { DesktopHeaderProps, NavItem } from "./AppHeader/DesktopHeader";

export { MobileHeader } from "./AppHeader/MobileHeader";
export type { MobileHeaderProps } from "./AppHeader/MobileHeader";

export { HeaderNavLink } from "./AppHeader/HeaderNavLink";
export type { HeaderNavLinkProps } from "./AppHeader/HeaderNavLink";

export { CartIndicator } from "./AppHeader/CartIndicator";
export type { CartIndicatorProps } from "./AppHeader/CartIndicator";

export { SearchTrigger } from "./AppHeader/SearchTrigger";
export type { SearchTriggerProps } from "./AppHeader/SearchTrigger";

export { AccountIndicator } from "./AppHeader/AccountIndicator";
export type { AccountIndicatorProps } from "./AppHeader/AccountIndicator";

export { HeaderWrapper } from "./HeaderWrapper";

// ============================================
// MOBILE DRAWER
// ============================================

export { MobileDrawer } from "./MobileDrawer";
export type { MobileDrawerProps } from "./MobileDrawer";

export { DrawerNavLink } from "./MobileDrawer/DrawerNavLink";
export type { DrawerNavLinkProps } from "./MobileDrawer/DrawerNavLink";

export { DrawerUserSection } from "./MobileDrawer/DrawerUserSection";
export type { DrawerUserSectionProps } from "./MobileDrawer/DrawerUserSection";

export { DrawerFooter } from "./MobileDrawer/DrawerFooter";
export type { DrawerFooterProps } from "./MobileDrawer/DrawerFooter";
