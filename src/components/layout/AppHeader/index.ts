/**
 * AppHeader component exports
 *
 * Main orchestrator for the application header with responsive layouts,
 * velocity-aware scroll hiding, and glassmorphism styling.
 */

// Main component
export { AppHeader, HeaderSpacer } from "./AppHeader";
export type { AppHeaderProps } from "./AppHeader";

// Sub-components for customization
export { DesktopHeader, defaultNavItems } from "./DesktopHeader";
export type { DesktopHeaderProps, NavItem } from "./DesktopHeader";

export { MobileHeader } from "./MobileHeader";
export type { MobileHeaderProps } from "./MobileHeader";

export { HeaderNavLink } from "./HeaderNavLink";
export type { HeaderNavLinkProps } from "./HeaderNavLink";

// Default export
export { AppHeader as default } from "./AppHeader";
