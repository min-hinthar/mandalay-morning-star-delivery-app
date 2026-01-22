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
 * - Uses z-index design tokens for fixed positioning
 */

import { type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { zClass } from "@/design-system/tokens/z-index";

// ============================================
// TYPES
// ============================================

export interface AppShellProps {
  /** Main page content */
  children: ReactNode;
  /** Optional content for header right side (actions, etc) */
  headerSlot?: ReactNode;
  /** Whether to show header area (default: true) */
  showHeader?: boolean;
  /** Whether to show bottom nav on mobile (default: true) */
  showBottomNav?: boolean;
  /** Additional container classes */
  className?: string;
}

// ============================================
// APPSHELL COMPONENT
// ============================================

export function AppShell({
  children,
  headerSlot,
  showHeader = true,
  showBottomNav = true,
  className,
}: AppShellProps) {
  return (
    <div className={cn("flex min-h-screen flex-col bg-white dark:bg-zinc-950", className)}>
      {/* Header placeholder - will be replaced by Header component in Plan 02 */}
      {showHeader && (
        <header
          className={cn(
            "fixed inset-x-0 top-0",
            "h-[72px]",
            "bg-white/80 dark:bg-zinc-900/80",
            "backdrop-blur-md",
            "border-b border-zinc-200/50 dark:border-zinc-800/50",
            "pt-safe", // iOS safe area
            zClass.fixed
          )}
        >
          {/* Header content placeholder - Plan 02 will implement full Header */}
          <div className="flex h-full items-center justify-between px-4">
            <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {/* Logo placeholder */}
            </div>
            {headerSlot && (
              <div className="flex items-center gap-2">
                {headerSlot}
              </div>
            )}
          </div>
        </header>
      )}

      {/* Main content area - fills space between header and bottom nav */}
      <main
        className={cn(
          "flex-1",
          showHeader && "pt-[72px]", // Offset for fixed header
          showBottomNav && "pb-16 md:pb-0" // Bottom padding for mobile nav
        )}
      >
        {children}
      </main>

      {/* Bottom nav placeholder - will be replaced by BottomNav component in Plan 03 */}
      {showBottomNav && (
        <nav
          className={cn(
            "fixed inset-x-0 bottom-0",
            "h-16",
            "bg-white/90 dark:bg-zinc-900/90",
            "backdrop-blur-md",
            "border-t border-zinc-200/50 dark:border-zinc-800/50",
            "pb-safe", // iOS safe area
            "md:hidden", // Hidden on desktop
            zClass.fixed
          )}
        >
          {/* Bottom nav content placeholder - Plan 03 will implement full BottomNav */}
          <div className="flex h-full items-center justify-around px-4">
            {/* Navigation items will go here */}
          </div>
        </nav>
      )}
    </div>
  );
}
