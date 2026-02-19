/**
 * V8 Driver Navigation - Teal Accent with Animated Indicator + Badges
 *
 * Bottom navigation for driver app with animated active indicator,
 * optional badge counts, and 56px touch targets for accessibility.
 */

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, History } from "lucide-react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { InitialsAvatar } from "./InitialsAvatar";

const navItems = [
  {
    label: "Home",
    href: "/driver",
    icon: Home,
    key: "home",
    exact: true,
  },
  {
    label: "Route",
    href: "/driver/route",
    icon: Package,
    key: "route",
    exact: false,
  },
  {
    label: "History",
    href: "/driver/history",
    icon: History,
    key: "history",
    exact: true,
  },
];

const indicatorSpring = { type: "spring" as const, stiffness: 300, damping: 30 };
const badgeSpring = { type: "spring" as const, stiffness: 400, damping: 20 };

interface DriverNavProps {
  /** Optional badge counts keyed by tab key (home, route, history) */
  badges?: Record<string, number>;
  /** Driver avatar URL for Home tab */
  avatarUrl?: string | null;
  /** Driver name for initials fallback */
  driverName?: string | null;
}

export function DriverNav({ badges, avatarUrl, driverName }: DriverNavProps) {
  const pathname = usePathname();

  return (
    <nav
      data-testid="driver-nav"
      // MOBILE CRASH PREVENTION: No backdrop-blur on mobile (causes Safari crashes)
      // DriverNav is mobile-only, so no blur at all
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface-primary safe-area-pb"
    >
      <div className="flex h-16 items-center justify-around px-4">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          const badgeCount = badges?.[item.key] ?? 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-h-[56px] min-w-[64px] flex-col items-center justify-center gap-1 rounded-input px-3 py-2 transition-colors duration-fast",
                isActive
                  ? "text-accent-teal"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
              )}
            >
              {/* Animated active indicator pill */}
              {isActive && (
                <m.div
                  layoutId="driver-nav-indicator"
                  className="absolute -bottom-0.5 h-1 w-6 rounded-full bg-accent-teal"
                  transition={indicatorSpring}
                />
              )}

              <div className="relative">
                {/* Show avatar for Home tab when driver data available */}
                {item.key === "home" && (avatarUrl || driverName) ? (
                  avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={driverName || "Driver"}
                      width={24}
                      height={24}
                      className={cn(
                        "h-6 w-6 rounded-full object-cover transition-transform duration-fast",
                        isActive && "scale-110 ring-2 ring-accent-teal"
                      )}
                      unoptimized
                    />
                  ) : (
                    <InitialsAvatar name={driverName ?? null} size="sm" className="h-6 w-6 text-2xs" />
                  )
                ) : (
                  <Icon
                    className={cn(
                      "h-6 w-6 transition-transform duration-fast",
                      isActive && "scale-110"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                )}

                {/* Badge count */}
                {badgeCount > 0 && (
                  <m.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={badgeSpring}
                    className="absolute -top-1.5 -right-2 flex min-w-5 h-5 items-center justify-center rounded-full bg-status-error px-1"
                  >
                    <span className="text-xs font-bold text-text-inverse leading-none">
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  </m.div>
                )}
              </div>

              <span className={cn("font-body text-xs font-medium", isActive && "font-semibold")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
