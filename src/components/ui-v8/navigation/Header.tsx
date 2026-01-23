"use client";

/**
 * V8 Header Component
 * Sticky header with scroll-aware shrink and blur effects
 *
 * Features:
 * - Fixed at top with z-fixed token
 * - Shrinks from 72px to 56px on scroll
 * - Hides on scroll down, shows on scroll up
 * - Backdrop blur increases when scrolled (8px -> 16px)
 * - Responsive: hamburger mobile, nav links desktop
 * - iOS safe area support
 */

import { type ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import { Menu } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { zClass } from "@/design-system/tokens/z-index";
import { useScrollDirection } from "@/lib/hooks/useScrollDirection";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { spring } from "@/lib/motion-tokens";

// ============================================
// TYPES
// ============================================

export interface HeaderNavItem {
  href: string;
  label: string;
  icon?: ReactNode;
}

export interface HeaderProps {
  /** Logo element (default: text "Morning Star") */
  logo?: ReactNode;
  /** Desktop navigation links */
  navItems?: HeaderNavItem[];
  /** Slot for cart button, profile dropdown, etc. */
  rightContent?: ReactNode;
  /** Hamburger menu click handler (mobile) */
  onMenuClick?: () => void;
  /** Additional container classes */
  className?: string;
}

// ============================================
// CONSTANTS
// ============================================

const HEADER_HEIGHT_FULL = 72;
const HEADER_HEIGHT_COLLAPSED = 56;
const SCROLL_THRESHOLD = 50;

// ============================================
// NAV LINK COMPONENT
// ============================================

const navLinkVariants: Variants = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  hover: { y: -2 },
};

interface NavLinkProps {
  href: string;
  label: string;
  icon?: ReactNode;
}

function NavLink({ href, label, icon }: NavLinkProps) {
  return (
    <motion.div
      variants={navLinkVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      transition={spring.snappy}
    >
      <Link
        href={href}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-lg",
          "text-sm font-medium text-zinc-700 dark:text-zinc-300",
          "hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80",
          "transition-colors duration-150"
        )}
      >
        {icon && <span className="w-4 h-4">{icon}</span>}
        <span>{label}</span>
      </Link>
    </motion.div>
  );
}

// ============================================
// HAMBURGER BUTTON COMPONENT
// ============================================

interface HamburgerButtonProps {
  onClick?: () => void;
}

function HamburgerButton({ onClick }: HamburgerButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      transition={spring.snappy}
      className={cn(
        "flex items-center justify-center",
        "w-10 h-10 -ml-2 rounded-lg",
        "text-zinc-700 dark:text-zinc-300",
        "hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80",
        "transition-colors duration-150",
        "md:hidden"
      )}
      aria-label="Open menu"
    >
      <Menu className="w-5 h-5" />
    </motion.button>
  );
}

// ============================================
// DEFAULT LOGO COMPONENT
// ============================================

function DefaultLogo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Morning Star
      </span>
    </Link>
  );
}

// ============================================
// HEADER COMPONENT
// ============================================

export function Header({
  logo,
  navItems = [],
  rightContent,
  onMenuClick,
  className,
}: HeaderProps) {
  // Scroll detection with threshold: 50
  const { isCollapsed, isAtTop } = useScrollDirection({ threshold: SCROLL_THRESHOLD });

  // Animation preference
  const { shouldAnimate, getSpring } = useAnimationPreference();

  // Calculate dynamic values based on scroll position
  const headerHeight = isAtTop ? HEADER_HEIGHT_FULL : HEADER_HEIGHT_COLLAPSED;
  const bgOpacity = isAtTop ? 0.6 : 0.95;
  const blurAmount = isAtTop ? 8 : 16;

  // Animation spring config
  const headerSpring = getSpring(spring.snappy);

  return (
    <motion.header
      initial={false}
      animate={{
        y: isCollapsed ? -HEADER_HEIGHT_FULL : 0,
        height: headerHeight,
      }}
      transition={shouldAnimate ? headerSpring : { duration: 0 }}
      style={{
        backgroundColor: `rgba(255, 255, 255, ${bgOpacity})`,
        backdropFilter: `blur(${blurAmount}px)`,
        WebkitBackdropFilter: `blur(${blurAmount}px)`,
      }}
      className={cn(
        "fixed inset-x-0 top-0",
        "border-b border-zinc-200/50 dark:border-zinc-800/50",
        "pt-safe", // iOS safe area
        zClass.fixed,
        // Dark mode background
        "dark:bg-zinc-900",
        className
      )}
    >
      {/* Inner container */}
      <div className="flex h-full items-center px-4 max-w-7xl mx-auto">
        {/* Mobile layout (below md) */}
        <div className="flex w-full items-center justify-between md:hidden">
          {/* Left: Hamburger */}
          <HamburgerButton onClick={onMenuClick} />

          {/* Center: Logo */}
          <div className="flex-1 flex justify-center">
            {logo ?? <DefaultLogo />}
          </div>

          {/* Right: Cart/Actions slot */}
          <div className="flex items-center gap-1">
            {rightContent}
          </div>
        </div>

        {/* Desktop layout (md and above) */}
        <div className="hidden md:flex w-full items-center justify-between">
          {/* Left: Logo */}
          <div className="flex-shrink-0">
            {logo ?? <DefaultLogo />}
          </div>

          {/* Center: Nav links */}
          {navItems.length > 0 && (
            <nav className="flex items-center gap-1 mx-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                />
              ))}
            </nav>
          )}

          {/* Right: Actions slot */}
          <div className="flex items-center gap-2">
            {rightContent}
          </div>
        </div>
      </div>
    </motion.header>
  );
}

export default Header;
