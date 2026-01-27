"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { useHeaderVisibility, getHeaderTransition } from "@/lib/hooks/useHeaderVisibility";
import { zClass } from "@/design-system/tokens/z-index";
import { DesktopHeader, type NavItem, defaultNavItems } from "./DesktopHeader";
import { MobileHeader } from "./MobileHeader";

/**
 * Header height constant
 */
const HEADER_HEIGHT = 64; // h-16 = 4rem = 64px

/**
 * Glassmorphism styles for light mode
 */
const glassStylesLight = {
  backgroundColor: "rgba(255, 255, 255, 0.75)",
  backdropFilter: "blur(30px)",
  WebkitBackdropFilter: "blur(30px)",
  borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
  boxShadow: `
    0 1px 0 rgba(164, 16, 52, 0.1),
    0 4px 20px -4px rgba(0, 0, 0, 0.1)
  `,
};

/**
 * Glassmorphism styles for dark mode
 */
const glassStylesDark = {
  backgroundColor: "rgba(24, 24, 27, 0.75)",
  backdropFilter: "blur(30px)",
  WebkitBackdropFilter: "blur(30px)",
  borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
  boxShadow: `
    0 1px 0 rgba(164, 16, 52, 0.2),
    0 4px 20px -4px rgba(0, 0, 0, 0.3)
  `,
};

/**
 * Props for AppHeader component
 */
export interface AppHeaderProps {
  /** Handler for mobile menu toggle */
  onMobileMenuToggle?: () => void;
  /** Whether mobile menu is open */
  isMobileMenuOpen?: boolean;
  /** Handler for search open */
  onSearchOpen?: () => void;
  /** Whether an overlay (drawer, modal, command palette) is open */
  overlayOpen?: boolean;
  /** Navigation items for desktop */
  navItems?: NavItem[];
  /** Current pathname for active nav detection */
  currentPath?: string;
  /** Content for right side of header */
  rightContent?: React.ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * AppHeader - Main header orchestrator with velocity-aware hide/show
 *
 * Features:
 * - Hide on scroll down, reappear on scroll up (iOS Safari pattern)
 * - Velocity-aware animation: fast scroll = instant hide, slow scroll = gradual spring
 * - Glassmorphism blur background (consistent treatment)
 * - Responsive: DesktopHeader (md+) vs MobileHeader (< md)
 * - Pins header when overlay is open
 *
 * @example
 * ```tsx
 * const [isMenuOpen, setIsMenuOpen] = useState(false);
 * const { isOpen: isCartOpen } = useCartDrawer();
 *
 * <AppHeader
 *   onMobileMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
 *   isMobileMenuOpen={isMenuOpen}
 *   overlayOpen={isCartOpen || isMenuOpen}
 *   rightContent={<CartButton />}
 * />
 * ```
 */
export const AppHeader = forwardRef<HTMLElement, AppHeaderProps>(
  (
    {
      onMobileMenuToggle,
      isMobileMenuOpen = false,
      onSearchOpen: _onSearchOpen,
      overlayOpen = false,
      navItems = defaultNavItems,
      currentPath = "",
      rightContent,
      className,
    },
    ref
  ) => {
    // Combined overlay state: menu open OR external overlay
    const isOverlayOpen = overlayOpen || isMobileMenuOpen;

    const { isVisible, isFastScroll } = useHeaderVisibility({
      overlayOpen: isOverlayOpen,
    });

    const handleMobileMenuToggle = () => {
      onMobileMenuToggle?.();
    };

    return (
      <motion.header
        ref={ref}
        className={cn(
          "fixed top-0 left-0 right-0",
          zClass.fixed,
          className
        )}
        initial={false}
        animate={{
          y: isVisible ? 0 : -HEADER_HEIGHT,
        }}
        transition={getHeaderTransition(isFastScroll)}
        style={glassStylesLight}
      >
        {/* Dark mode glassmorphism - apply via CSS class override */}
        <style jsx global>{`
          .dark header[class*="fixed"] {
            background-color: ${glassStylesDark.backgroundColor} !important;
            border-bottom: ${glassStylesDark.borderBottom} !important;
            box-shadow: ${glassStylesDark.boxShadow} !important;
          }
        `}</style>

        {/* Top accent border with primary gradient glow */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-secondary via-primary to-secondary opacity-60"
          aria-hidden="true"
        />

        {/* Main header content */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 relative">
          <div className="flex items-center justify-between h-16">
            {/* Desktop Header (hidden on mobile) */}
            <DesktopHeader
              navItems={navItems}
              currentPath={currentPath}
              rightContent={rightContent}
            />

            {/* Mobile Header (hidden on desktop) */}
            <MobileHeader
              onMenuToggle={handleMobileMenuToggle}
              isMobileMenuOpen={isMobileMenuOpen}
              rightContent={rightContent}
            />
          </div>
        </div>
      </motion.header>
    );
  }
);

AppHeader.displayName = "AppHeader";

/**
 * HeaderSpacer - Add below AppHeader to prevent content overlap
 */
export function HeaderSpacer({ className }: { className?: string }) {
  return (
    <div
      className={cn("h-16", className)}
      style={{ height: HEADER_HEIGHT }}
      aria-hidden="true"
    />
  );
}

export default AppHeader;
