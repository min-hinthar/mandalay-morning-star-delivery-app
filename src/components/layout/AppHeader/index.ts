/**
 * AppHeader component exports
 *
 * Main orchestrator for the application header with responsive layouts,
 * velocity-aware scroll hiding, and glassmorphism styling.
 *
 * Features:
 * - Integrated cart indicator with bounce animation
 * - Account indicator with avatar/dropdown
 * - Search trigger with Cmd/Ctrl+K shortcut
 * - Mobile drawer with swipe-to-close
 * - Command palette for menu search
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

// Indicator components
export { CartIndicator } from "./CartIndicator";
export type { CartIndicatorProps } from "./CartIndicator";

export { SearchTrigger } from "./SearchTrigger";
export type { SearchTriggerProps } from "./SearchTrigger";

export { AccountIndicator } from "./AccountIndicator";
export type { AccountIndicatorProps } from "./AccountIndicator";

// Default export
export { AppHeader as default } from "./AppHeader";
