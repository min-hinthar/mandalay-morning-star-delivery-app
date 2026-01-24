/**
 * V6 Driver Navigation - Pepper Aesthetic
 *
 * Bottom navigation for driver app with V6 colors and high-contrast support.
 * 56px touch targets for accessibility, sticky positioning.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, History } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  {
    label: "Home",
    href: "/driver",
    icon: Home,
    exact: true,
  },
  {
    label: "Route",
    href: "/driver/route",
    icon: Package,
    exact: false,
  },
  {
    label: "History",
    href: "/driver/history",
    icon: History,
    exact: true,
  },
];

export function DriverNav() {
  const pathname = usePathname();

  return (
    <nav
      data-testid="driver-nav"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface-primary/95 backdrop-blur-sm safe-area-pb"
    >
      <div className="flex h-16 items-center justify-around px-4">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[56px] min-w-[64px] flex-col items-center justify-center gap-1 rounded-input px-3 py-2 transition-all duration-fast",
                isActive
                  ? "text-primary"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
              )}
            >
              <Icon
                className={cn(
                  "h-6 w-6 transition-transform duration-fast",
                  isActive && "scale-110"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={cn(
                  "font-body text-xs font-medium",
                  isActive && "font-semibold"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
