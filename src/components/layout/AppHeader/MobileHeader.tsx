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
  /** Content for right side (cart icon, etc.) */
  rightContent?: React.ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * MobileHeader - Mobile-specific header layout
 *
 * Layout: Hamburger left, Logo center, Cart/Account right
 * Uses MorphingMenu for hamburger button.
 * Compact logo variant (just image, no text on mobile).
 *
 * @example
 * <MobileHeader
 *   onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
 *   isMobileMenuOpen={isMenuOpen}
 *   rightContent={<CartButton />}
 * />
 */
export function MobileHeader({
  onMenuToggle,
  isMobileMenuOpen,
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
      {/* Left: Hamburger menu button */}
      <div className="flex-shrink-0">
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
            className="object-contain"
          />
        </Link>
      </motion.div>

      {/* Right: Cart/Account (passed as rightContent) */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {rightContent}
      </div>
    </div>
  );
}

export default MobileHeader;
