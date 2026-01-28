"use client";

import { type ReactNode, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Truck,
  BarChart3,
  UtensilsCrossed,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { zClass } from "@/lib/design-system/tokens/z-index";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { id: "orders", label: "Orders", href: "/admin/orders", icon: ClipboardList },
  { id: "drivers", label: "Drivers", href: "/admin/drivers", icon: Truck },
  { id: "analytics", label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { id: "menu", label: "Menu", href: "/admin/menu", icon: UtensilsCrossed },
];

interface AdminLayoutProps {
  children: ReactNode;
  /** Current user for the avatar dropdown */
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

/**
 * Admin Dashboard Shell
 * Desktop-first layout for kitchen administrators
 *
 * Structure:
 * - Top Nav (64px) - logo, nav items, user dropdown
 * - Main Content (full width, max 1536px, centered)
 *
 * Features:
 * - Desktop-first (1024px minimum)
 * - Active nav item styling with underline
 * - User dropdown menu
 * - All dashboard content above fold on 1080p
 */
export function AdminLayout({ children, user }: AdminLayoutProps) {
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isActive = useCallback(
    (href: string) => {
      if (href === "/admin") {
        return pathname === "/admin";
      }
      return pathname.startsWith(href);
    },
    [pathname]
  );

  const toggleUserMenu = useCallback(() => {
    setShowUserMenu((prev) => !prev);
  }, []);

  const closeUserMenu = useCallback(() => {
    setShowUserMenu(false);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-20 h-16 border-b border-[var(--color-border)] bg-[var(--color-cream)]">
        <div className="mx-auto flex h-full max-w-[var(--max-admin-width)] items-center justify-between px-6">
          {/* Logo */}
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-2",
              "font-display text-lg font-bold",
              "text-[var(--color-primary)]",
              "transition-opacity hover:opacity-80"
            )}
          >
            <Star className="h-6 w-6" />
            <span className="hidden sm:inline">Mandalay Morning Star</span>
            <span className="sm:hidden">MMS</span>
          </Link>

          {/* Nav Items (center) */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-lg",
                    "text-sm font-medium",
                    "transition-colors duration-[var(--duration-fast)]",
                    active
                      ? "text-[var(--color-primary)]"
                      : "text-[var(--color-charcoal-muted)] hover:text-[var(--color-charcoal)] hover:bg-[var(--color-cream-darker)]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>

                  {/* Active indicator */}
                  {active && (
                    <motion.div
                      layoutId="admin-nav-indicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--color-primary)] rounded-full"
                      transition={spring.snappy}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Dropdown */}
          <div className="relative">
            <motion.button
              onClick={toggleUserMenu}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-1.5",
                "transition-colors hover:bg-[var(--color-cream-darker)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  "bg-[var(--color-primary)] text-text-inverse text-sm font-semibold"
                )}
              >
                {user?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || "A"
                )}
              </div>

              {/* Name (desktop only) */}
              <span className="hidden lg:block text-sm font-medium text-[var(--color-charcoal)]">
                {user?.name || "Admin"}
              </span>

              <ChevronDown
                className={cn(
                  "h-4 w-4 text-[var(--color-charcoal-muted)]",
                  "transition-transform duration-[var(--duration-fast)]",
                  showUserMenu && "rotate-180"
                )}
              />
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {/* Backdrop - rendered separately to avoid Fragment inside AnimatePresence */}
              {showUserMenu && (
                <motion.div
                  key="admin-dropdown-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn("fixed inset-0", zClass.modalBackdrop)}
                  onClick={closeUserMenu}
                />
              )}

              {/* Menu - rendered separately to avoid Fragment inside AnimatePresence */}
              {showUserMenu && (
                <motion.div
                  key="admin-dropdown-menu"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={spring.snappy}
                  className={cn(
                    "absolute right-0 top-full mt-2",
                    "w-56 rounded-lg border border-[var(--color-border)]",
                    "bg-[var(--color-surface)] shadow-lg",
                    "overflow-hidden",
                    zClass.popover
                  )}
                >
                  {/* User Info */}
                  <div className="border-b border-[var(--color-border)] px-4 py-3">
                    <p className="font-medium text-[var(--color-charcoal)]">
                      {user?.name || "Admin User"}
                    </p>
                    <p className="text-sm text-[var(--color-charcoal-muted)]">
                      {user?.email || "admin@example.com"}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <Link
                      href="/admin/settings"
                      onClick={closeUserMenu}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2",
                        "text-sm text-[var(--color-charcoal)]",
                        "transition-colors hover:bg-[var(--color-cream-darker)]"
                      )}
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <Link
                      href="/admin/profile"
                      onClick={closeUserMenu}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2",
                        "text-sm text-[var(--color-charcoal)]",
                        "transition-colors hover:bg-[var(--color-cream-darker)]"
                      )}
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-[var(--color-border)] py-1">
                    <Link
                      href="/"
                      onClick={closeUserMenu}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2",
                        "text-sm text-[var(--color-error)]",
                        "transition-colors hover:bg-[var(--color-error-light)]"
                      )}
                    >
                      <LogOut className="h-4 w-4" />
                      Exit Admin
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-[var(--max-admin-width)] px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}

/**
 * Dashboard Grid Component
 * Standard layout for admin dashboard pages
 */
export function DashboardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {children}
    </div>
  );
}

/**
 * KPI Row - Full width row for KPI cards
 */
export function KPIRow({ children }: { children: ReactNode }) {
  return (
    <div className="lg:col-span-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {children}
    </div>
  );
}

/**
 * Main Content Area - 60% width
 */
export function MainArea({ children }: { children: ReactNode }) {
  return <div className="lg:col-span-7 space-y-6">{children}</div>;
}

/**
 * Side Area - 40% width
 */
export function SideArea({ children }: { children: ReactNode }) {
  return <div className="lg:col-span-5 space-y-6">{children}</div>;
}

/**
 * Full Width Area
 */
export function FullWidthArea({ children }: { children: ReactNode }) {
  return <div className="lg:col-span-12">{children}</div>;
}

export default AdminLayout;
