"use client";

/**
 * V8 AppShell Component
 * Main layout wrapper providing structure for header, content, and bottom nav
 *
 * Features:
 * - Flex column layout with min-height screen
 * - Header slot (72px) with safe area for iOS
 * - Main content area fills available space (flex-1)
 * - Bottom nav slot (64px) on mobile only
 * - MobileMenu controlled by hamburger in Header
 * - Uses z-index design tokens for fixed positioning
 */

import { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { MobileMenu, type MobileMenuNavItem } from "./MobileMenu";

// ============================================
// TYPES
// ============================================

export interface AppShellNavItem {
  href: string;
  label: string;
  icon?: ReactNode;
}

export interface AppShellProps {
  /** Main page content */
  children: ReactNode;
  /** Optional content for header right side (actions, etc) */
  headerSlot?: ReactNode;
  /** Whether to show header area (default: true) */
  showHeader?: boolean;
  /** Whether to show bottom nav on mobile (default: true) */
  showBottomNav?: boolean;
  /** Navigation items for MobileMenu and Header */
  navItems?: AppShellNavItem[];
  /** Optional user name for mobile menu greeting */
  userName?: string;
  /** Additional container classes */
  className?: string;
}

// ============================================
// DEFAULT NAV ITEMS
// ============================================

const defaultNavItems: AppShellNavItem[] = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/orders", label: "Orders" },
  { href: "/account", label: "Account" },
];

// ============================================
// APPSHELL COMPONENT
// ============================================

export function AppShell({
  children,
  headerSlot,
  showHeader = true,
  showBottomNav = true,
  navItems = defaultNavItems,
  userName,
  className,
}: AppShellProps) {
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className={cn("flex min-h-screen flex-col bg-surface-primary dark:bg-surface-primary", className)}>
      {/* Header component */}
      {showHeader && (
        <Header
          navItems={navItems}
          rightContent={headerSlot}
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />
      )}

      {/* Main content area - fills space between header and bottom nav */}
      <main
        className={cn(
          "flex-1",
          // pt-[72px] is calculated offset for fixed header height
          // eslint-disable-next-line no-restricted-syntax
          showHeader && "pt-[72px]",
          showBottomNav && "pb-16 md:pb-0"
        )}
      >
        {children}
      </main>

      {/* Bottom nav component (mobile only) */}
      {showBottomNav && <BottomNav />}

      {/* Mobile menu controlled by hamburger in Header */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navItems={navItems as MobileMenuNavItem[]}
        userName={userName}
      />
    </div>
  );
}
