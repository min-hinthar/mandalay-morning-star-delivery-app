"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { MorphingMenu } from "@/components/ui/MorphingMenu";

/**
 * Props for MobileHeader component
 */
export interface MobileHeaderProps {
  /** Handler for menu toggle */
  onMenuToggle: () => void;
  /** Whether mobile menu is currently open */
  isMobileMenuOpen: boolean;
  /** Content for left side (avatar, theme toggle) */
  leftContent?: React.ReactNode;
  /** Content for right side (search, cart, hamburger) */
  rightContent?: React.ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * MobileHeader - Mobile-specific header layout
 *
 * Layout: Avatar/Theme left, Logo center, Search/Cart/Hamburger right
 * Uses MorphingMenu for hamburger button.
 * Compact logo variant (just image, no text on mobile).
 *
 * @example
 * <MobileHeader
 *   onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
 *   isMobileMenuOpen={isMenuOpen}
 *   leftContent={<ThemeToggle />}
 *   rightContent={<CartIndicator />}
 * />
 */
export function MobileHeader({
  onMenuToggle,
  isMobileMenuOpen,
  leftContent,
  rightContent,
  className,
}: MobileHeaderProps) {
  const { shouldAnimate, getSpring, isFullMotion } = useAnimationPreference();

  return (
    <div
      className={cn(
        "flex md:hidden items-center justify-between w-full",
        className
      )}
    >
      {/* Left: Avatar and Theme toggle */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {leftContent}
      </div>

      {/* Center: Compact logo (image only on mobile) */}
      <motion.div
        whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
        whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
        transition={getSpring(spring.snappy)}
        className="absolute left-1/2 -translate-x-1/2"
      >
        <Link
          href="/"
          className={cn(
            "font-display text-lg font-semibold",
            "text-primary hover:text-primary-hover transition-colors",
            "flex items-center gap-2"
          )}
        >
          <Image
            src="/logo.png"
            alt="Mandalay Morning Star"
            width={32}
            height={32}
            priority
            style={{ width: 32, height: 32 }}
          />
        </Link>
      </motion.div>

      {/* Right: Search, Cart, and Hamburger */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {rightContent}
        <MorphingMenu
          isOpen={isMobileMenuOpen}
          onToggle={onMenuToggle}
          size={20}
          color="#374151"
          openColor="#A41034"
          variant="rounded"
          haptic={isFullMotion}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        />
      </div>
    </div>
  );
}

export default MobileHeader;
