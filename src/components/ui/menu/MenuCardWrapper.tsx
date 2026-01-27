"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { staggerDelay, VIEWPORT_AMOUNT } from "@/lib/motion-tokens";

// ============================================
// TYPES
// ============================================

export interface MenuCardWrapperProps {
  /** Card content (UnifiedMenuItemCard) */
  children: React.ReactNode;
  /** Item ID for React key and data attribute */
  itemId: string;
  /** Index for stagger animation delay calculation */
  index: number;
  /** Replay animation when scrolling back into view (default: true) */
  replayOnScroll?: boolean;
  /**
   * Animation mode:
   * - "viewport": Animate when scrolling into view (default)
   * - "immediate": Animate immediately on mount (for AnimatePresence)
   */
  animateMode?: "viewport" | "immediate";
  /** Fixed width for carousel items (e.g., "w-[280px] md:w-[320px]") */
  fixedWidth?: string;
  /** Additional className */
  className?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * MenuCardWrapper - Unified wrapper for menu item cards
 *
 * Provides consistent:
 * - Glow-gradient hover effect
 * - Staggered scroll-reveal animation
 * - Viewport detection settings
 * - Data attributes for debugging
 *
 * @example
 * // Viewport mode (default) - animates on scroll
 * <MenuCardWrapper itemId={item.id} index={index}>
 *   <UnifiedMenuItemCard item={item} variant="menu" />
 * </MenuCardWrapper>
 *
 * // Immediate mode - for AnimatePresence transitions
 * <MenuCardWrapper itemId={item.id} index={index} animateMode="immediate">
 *   <UnifiedMenuItemCard item={item} variant="menu" />
 * </MenuCardWrapper>
 */
export function MenuCardWrapper({
  children,
  itemId,
  index,
  replayOnScroll = true,
  animateMode = "viewport",
  fixedWidth,
  className,
}: MenuCardWrapperProps) {
  const { shouldAnimate } = useAnimationPreference();

  // Viewport mode: animate when scrolling into view
  if (animateMode === "viewport") {
    return (
      <motion.div
        data-menu-card={itemId}
        className={cn(
          "glow-gradient rounded-2xl",
          fixedWidth,
          className
        )}
        initial={shouldAnimate ? { opacity: 0, y: 18 } : undefined}
        whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        viewport={{
          once: !replayOnScroll,
          amount: VIEWPORT_AMOUNT,
        }}
        transition={{
          delay: staggerDelay(index),
          duration: 0.55,
        }}
      >
        {children}
      </motion.div>
    );
  }

  // Immediate mode: animate on mount (for AnimatePresence)
  return (
    <motion.div
      data-menu-card={itemId}
      className={cn(
        "glow-gradient rounded-2xl",
        fixedWidth,
        className
      )}
      initial={shouldAnimate ? { opacity: 0, y: 18 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{
        delay: staggerDelay(index),
        duration: 0.55,
      }}
    >
      {children}
    </motion.div>
  );
}

export default MenuCardWrapper;
