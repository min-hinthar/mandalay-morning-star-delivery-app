"use client";

/**
 * BottomNav Component
 * Mobile bottom navigation with animated active indicator
 *
 * Features:
 * - Fixed at bottom on mobile only (hidden on md+)
 * - Animated active state with layoutId for smooth transitions
 * - Icon scale animation on active
 * - iOS safe area support
 * - Respects animation preferences
 *
 * @example
 * <BottomNav />
 */

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, UtensilsCrossed, Package, User } from "lucide-react";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { spring } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils/cn";

export interface BottomNavItem {
  /** Route href */
  href: string;
  /** Display label */
  label: string;
  /** Icon component */
  icon: ReactNode;
}

export interface BottomNavProps {
  /** Navigation items (defaults to Home, Menu, Orders, Account) */
  items?: BottomNavItem[];
  /** Additional CSS classes */
  className?: string;
}

const defaultItems: BottomNavItem[] = [
  { href: "/", label: "Home", icon: <Home className="h-5 w-5" /> },
  { href: "/menu", label: "Menu", icon: <UtensilsCrossed className="h-5 w-5" /> },
  { href: "/orders", label: "Orders", icon: <Package className="h-5 w-5" /> },
  { href: "/account", label: "Account", icon: <User className="h-5 w-5" /> },
];

export function BottomNav({ items = defaultItems, className }: BottomNavProps) {
  const pathname = usePathname();
  const { shouldAnimate } = useAnimationPreference();

  /**
   * Active state detection
   * Exact match for root, prefix match for other routes
   */
  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-30",
        // MOBILE CRASH PREVENTION: No backdrop-blur on mobile (causes Safari crashes)
        // BottomNav is mobile-only (md:hidden) so no blur at all
        "bg-background border-t border-border/50",
        "md:hidden",
        className
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Main navigation"
    >
      <div className="flex h-16 items-center justify-around">
        {items.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center",
                "min-w-[64px] py-2 px-3",
                "transition-colors"
              )}
              aria-current={active ? "page" : undefined}
            >
              {/* Icon with scale animation */}
              <motion.span
                animate={shouldAnimate ? { scale: active ? 1.1 : 1 } : {}}
                transition={spring.snappy}
                className={cn(
                  "transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.icon}
              </motion.span>

              {/* Label */}
              <span
                className={cn(
                  "mt-1 text-xs font-medium",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>

              {/* Animated active indicator */}
              {active && (
                <motion.span
                  layoutId="bottomNavIndicator"
                  className="absolute bottom-1 h-0.5 w-6 rounded-full bg-primary"
                  transition={spring.snappy}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
