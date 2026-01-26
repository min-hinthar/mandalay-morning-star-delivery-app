"use client";

import { type ReactNode, type ElementType } from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// Default animation constants per Phase 22 CONTEXT
const DEFAULT_STAGGER_GAP = 0.08; // 80ms stagger between children
const DEFAULT_VIEWPORT_AMOUNT = 0.25; // 25% visible to trigger

/**
 * Create container variants for staggered children animation.
 * Per CONTEXT Phase 22: 80ms stagger, 25% viewport, always replay on scroll.
 */
function createContainerVariants(staggerGap: number): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerGap,
        delayChildren: 0.1,
      },
    },
  };
}

/**
 * Item variants for child elements within AnimatedSection.
 * Use with motion.div variants={itemVariants} for staggered reveal.
 *
 * Per CONTEXT: 200-300ms duration (0.25s), y: 24px slide up.
 */
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: [0.2, 0.9, 0.3, 1], // easing.default from motion-tokens
    },
  },
};

interface AnimatedSectionProps {
  /** Section content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Section ID for scroll spy navigation */
  id?: string;
  /** HTML element to render (default: section) */
  as?: ElementType;
  /** Custom stagger gap in seconds (default: 0.08 = 80ms) */
  staggerGap?: number;
  /** Viewport amount to trigger animation (default: 0.25 = 25%) */
  viewportAmount?: number;
}

/**
 * Reusable scroll-triggered animation wrapper.
 *
 * Features:
 * - Trigger at 25% visible (viewport.amount: 0.25) - per Phase 22 CONTEXT
 * - Animation speed: 200-300ms (duration: 0.25)
 * - Stagger delay: 80ms between children - per Phase 22 CONTEXT
 * - Always replay: viewport.once: false
 * - Respects useAnimationPreference for reduced motion
 * - Configurable stagger and viewport via props
 *
 * Usage:
 * ```tsx
 * <AnimatedSection id="how-it-works">
 *   <motion.h2 variants={itemVariants}>How It Works</motion.h2>
 *   <motion.div variants={itemVariants}>Step 1</motion.div>
 *   <motion.div variants={itemVariants}>Step 2</motion.div>
 * </AnimatedSection>
 * ```
 */
export function AnimatedSection({
  children,
  className,
  id,
  as = "section",
  staggerGap: customStaggerGap,
  viewportAmount: customViewportAmount,
}: AnimatedSectionProps) {
  const staggerGap = customStaggerGap ?? DEFAULT_STAGGER_GAP;
  const viewportAmount = customViewportAmount ?? DEFAULT_VIEWPORT_AMOUNT;
  const { shouldAnimate } = useAnimationPreference();

  // For reduced motion: render plain element without animation
  if (!shouldAnimate) {
    const Component = as as "section";
    return (
      <Component id={id} className={className}>
        {children}
      </Component>
    );
  }

  // Cast for TypeScript - motion[as] is valid but TS needs help
  const MotionComponent = motion[as as keyof typeof motion] as typeof motion.section;
  const containerVariants = createContainerVariants(staggerGap);

  return (
    <MotionComponent
      id={id}
      className={cn("overflow-hidden", className)}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{
        once: false, // Always replay per CONTEXT decision
        amount: viewportAmount, // Trigger at 25% visible per Phase 22 CONTEXT
      }}
    >
      {children}
    </MotionComponent>
  );
}
