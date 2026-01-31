"use client";

import { forwardRef, useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import {
  useHeaderVisibility,
  getHeaderTransition,
  useCommandPalette,
  useCartDrawer,
  useMenu,
  useAuth,
} from "@/lib/hooks";
import { zClass } from "@/lib/design-system/tokens/z-index";
import { DesktopHeader, type NavItem, defaultNavItems } from "./DesktopHeader";
import { MobileHeader } from "./MobileHeader";
import { CartIndicator } from "./CartIndicator";
import { SearchTrigger } from "./SearchTrigger";
import { AccountIndicator } from "./AccountIndicator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MobileDrawer } from "@/components/ui/layout/MobileDrawer";
import { CommandPalette } from "@/components/ui/search";

/**
 * Header height constant
 */
const HEADER_HEIGHT = 64; // h-16 = 4rem = 64px

/**
 * Glassmorphism styles for light mode
 */
// MOBILE CRASH PREVENTION: backdropFilter removed from inline styles
// Blur is applied via Tailwind sm:backdrop-blur-2xl class instead
const glassStylesLight = {
  backgroundColor: "rgba(255, 255, 255, 0.75)",
  borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
  boxShadow: `
    0 1px 0 rgba(164, 16, 52, 0.1),
    0 4px 20px -4px rgba(0, 0, 0, 0.1)
  `,
};

/**
 * Glassmorphism styles for dark mode
 * MOBILE CRASH PREVENTION: backdropFilter removed (applied via Tailwind sm:backdrop-blur-2xl)
 */
const glassStylesDark = {
  backgroundColor: "rgba(24, 24, 27, 0.75)",
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
  /** Navigation items for desktop */
  navItems?: NavItem[];
  /** Additional class names */
  className?: string;
}

/**
 * AppHeader - Complete header with integrated cart, account, search, and mobile drawer
 *
 * Features:
 * - Hide on scroll down, reappear on scroll up (iOS Safari pattern)
 * - Velocity-aware animation: fast scroll = instant hide, slow scroll = gradual spring
 * - Glassmorphism blur background (consistent treatment)
 * - Responsive: DesktopHeader (md+) vs MobileHeader (< md)
 * - Pins header when overlay is open
 * - Integrated cart indicator with bounce animation
 * - Account indicator with avatar/dropdown
 * - Search trigger with Cmd/Ctrl+K shortcut
 * - Mobile drawer with swipe-to-close
 * - Command palette for menu search
 *
 * @example
 * ```tsx
 * <AppHeader />
 * <HeaderSpacer />
 * {children}
 * ```
 */
export const AppHeader = forwardRef<HTMLElement, AppHeaderProps>(
  ({ navItems = defaultNavItems, className }, ref) => {
    const pathname = usePathname();
    const { user } = useAuth();
    const { isOpen: isCartOpen } = useCartDrawer();
    const { isOpen: isPaletteOpen, open: openPalette, close: closePalette } = useCommandPalette();
    const { data: menuData } = useMenu();

    // Mobile drawer state
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Flatten menu items for command palette
    const menuItems = useMemo(() => {
      if (!menuData?.data?.categories) return [];
      return menuData.data.categories.flatMap((c) => c.items);
    }, [menuData]);

    // User data for mobile drawer
    const drawerUser = useMemo(() => {
      if (!user) return null;
      return {
        name: user.user_metadata?.full_name as string | undefined,
        email: user.email || undefined,
        avatar: user.user_metadata?.avatar_url as string | undefined,
      };
    }, [user]);

    // Close mobile menu on route change
    useEffect(() => {
      setIsMobileMenuOpen(false);
    }, [pathname]);

    // Combined overlay state for header pinning
    const isOverlayOpen = isMobileMenuOpen || isCartOpen || isPaletteOpen;

    const { isVisible, isFastScroll } = useHeaderVisibility({
      overlayOpen: isOverlayOpen,
    });

    // Desktop right content: Theme, Search, Cart, Account (per CONTEXT.md order)
    const desktopRightContent = (
      <>
        <ThemeToggle />
        <SearchTrigger onClick={openPalette} />
        <CartIndicator />
        <AccountIndicator />
      </>
    );

    // Mobile left content: Avatar and Theme toggle
    const mobileLeftContent = (
      <>
        <AccountIndicator className="h-9 w-9" />
        <ThemeToggle className="h-9 w-9" />
      </>
    );

    // Mobile right content: Search and Cart only (hamburger is inside MobileHeader)
    const mobileRightContent = (
      <>
        <SearchTrigger onClick={openPalette} className="h-10 w-10" />
        <CartIndicator className="h-10 w-10" />
      </>
    );

    return (
      <>
        <motion.header
          ref={ref}
          // MOBILE CRASH PREVENTION: Blur only on sm+ to prevent Safari crashes
          className={cn("fixed top-0 left-0 right-0 sm:backdrop-blur-2xl", zClass.fixed, className)}
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
            className="absolute top-0 left-0 right-0 h-0.5 opacity-60"
            style={{ background: "linear-gradient(to right, var(--color-secondary), var(--color-primary), var(--color-secondary))" }}
            aria-hidden="true"
          />

          {/* Main header content */}
          <div className="mx-auto max-w-7xl px-4 sm:px-6 relative">
            <div className="flex items-center justify-between h-16">
              {/* Desktop Header (hidden on mobile) */}
              <DesktopHeader
                navItems={navItems}
                currentPath={pathname}
                rightContent={desktopRightContent}
              />

              {/* Mobile Header (hidden on desktop) */}
              <MobileHeader
                onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                isMobileMenuOpen={isMobileMenuOpen}
                leftContent={mobileLeftContent}
                rightContent={mobileRightContent}
              />
            </div>
          </div>
        </motion.header>

        {/* Mobile Drawer */}
        <MobileDrawer
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          user={drawerUser}
        />

        {/* Command Palette */}
        <CommandPalette
          open={isPaletteOpen}
          onOpenChange={(open) => !open && closePalette()}
          menuItems={menuItems}
        />
      </>
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
