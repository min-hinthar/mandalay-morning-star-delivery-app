"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { UtensilsCrossed, Package, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { HeaderNavLink } from "./HeaderNavLink";

/**
 * Navigation item configuration
 */
export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
}

/**
 * Default navigation items for the desktop header
 */
export const defaultNavItems: NavItem[] = [
  {
    href: "/menu",
    label: "Menu",
    icon: <UtensilsCrossed className="w-5 h-5" />,
  },
  {
    href: "/orders",
    label: "Orders",
    icon: <Package className="w-5 h-5" />,
  },
  {
    href: "/account",
    label: "Account",
    icon: <User className="w-5 h-5" />,
  },
];

/**
 * Props for DesktopHeader component
 */
export interface DesktopHeaderProps {
  /** Navigation items to display */
  navItems?: NavItem[];
  /** Content for the right side (cart, search, theme toggle, etc.) */
  rightContent?: React.ReactNode;
  /** Current pathname for active state detection */
  currentPath?: string;
  /** Additional class names */
  className?: string;
}

/**
 * DesktopHeader - Desktop-specific header layout
 *
 * Layout: Nav left, Logo center (absolute), rightContent right
 *
 * @example
 * <DesktopHeader
 *   navItems={defaultNavItems}
 *   rightContent={<CartButton />}
 *   currentPath="/menu"
 * />
 */
export function DesktopHeader({
  navItems = defaultNavItems,
  rightContent,
  currentPath = "",
  className,
}: DesktopHeaderProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <div
      className={cn(
        "hidden md:flex items-center justify-between w-full relative",
        className
      )}
    >
      {/* Left: Navigation */}
      <nav className="flex items-center gap-1">
        {navItems.map((item) => (
          <HeaderNavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isActive={currentPath === item.href || currentPath.startsWith(`${item.href}/`)}
          />
        ))}
      </nav>

      {/* Center: Logo (absolutely positioned for true centering) */}
      <motion.div
        whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
        whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
        transition={getSpring(spring.snappy)}
        className="absolute left-1/2 -translate-x-1/2"
      >
        <Link
          href="/"
          className={cn(
            "font-display text-lg font-bold",
            "text-primary hover:text-primary-hover transition-colors",
            "flex items-center gap-2"
          )}
        >
          <Image
            src="/logo.png"
            alt="Mandalay Morning Star"
            width={48}
            height={48}
            priority
            style={{ height: "auto" }}
            className="w-12"
          />
          <span className="hidden lg:inline">Mandalay Morning Star</span>
        </Link>
      </motion.div>

      {/* Right: Custom content (cart, search, theme, account indicators) */}
      <div className="flex items-center gap-2">
        {rightContent}
      </div>
    </div>
  );
}

export default DesktopHeader;
