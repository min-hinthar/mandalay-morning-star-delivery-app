"use client";

/**
 * MobileMenu Component
 * Slide-out mobile navigation menu using Drawer
 *
 * Features:
 * - Uses Phase 2 Drawer component for side panel behavior
 * - Auto-closes on route change via useRouteChangeClose
 * - Immediate close on link click
 * - Active state highlighting for current route
 *
 * @example
 * const [isOpen, setIsOpen] = useState(false);
 * <MobileMenu
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   navItems={[{ href: "/menu", label: "Menu", icon: <UtensilsCrossed /> }]}
 * />
 */

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Drawer } from "@/components/ui";
import { useRouteChangeClose } from "@/lib/hooks/useRouteChangeClose";
import { cn } from "@/lib/utils/cn";

export interface MobileMenuNavItem {
  /** Route href */
  href: string;
  /** Display label */
  label: string;
  /** Optional icon component */
  icon?: ReactNode;
}

export interface MobileMenuProps {
  /** Whether menu is open */
  isOpen: boolean;
  /** Callback to close menu */
  onClose: () => void;
  /** Navigation items to display */
  navItems: MobileMenuNavItem[];
  /** Optional user greeting at top */
  userName?: string;
  /** Secondary navigation items (Settings, Help, etc.) */
  secondaryItems?: MobileMenuNavItem[];
  /** Additional CSS classes for content area */
  className?: string;
}

export function MobileMenu({
  isOpen,
  onClose,
  navItems,
  userName,
  secondaryItems,
  className,
}: MobileMenuProps) {
  const pathname = usePathname();

  // Auto-close on route change (backup - links also call onClose directly)
  useRouteChangeClose(isOpen, onClose);

  /**
   * Active state detection
   * Exact match for root, prefix match for other routes
   */
  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      side="left"
      width="sm"
      title="Menu"
    >
      <div className={cn("flex flex-col h-full", className)}>
        {/* User greeting */}
        {userName && (
          <div className="px-4 py-4 border-b border-border/50">
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <p className="text-lg font-semibold text-foreground">{userName}</p>
          </div>
        )}

        {/* Primary navigation */}
        <nav className="flex-1 py-4" aria-label="Main navigation">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const active = isActive(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg",
                      "hover:bg-accent transition-colors",
                      active && "bg-accent text-primary font-medium"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.icon && (
                      <span
                        className={cn(
                          active ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        {item.icon}
                      </span>
                    )}
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Secondary navigation */}
        {secondaryItems && secondaryItems.length > 0 && (
          <>
            <div className="border-t border-border/50" />
            <nav className="py-4" aria-label="Secondary navigation">
              <ul className="space-y-1 px-2">
                {secondaryItems.map((item) => {
                  const active = isActive(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg",
                          "hover:bg-accent transition-colors",
                          "text-muted-foreground",
                          active && "bg-accent text-primary"
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        {item.icon && <span>{item.icon}</span>}
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </>
        )}
      </div>
    </Drawer>
  );
}
