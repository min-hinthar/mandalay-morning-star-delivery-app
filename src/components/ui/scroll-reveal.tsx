/**
 * V6 Scroll Reveal Component - Pepper Aesthetic
 *
 * Wrapper component for scroll-triggered animations.
 * Uses Framer Motion whileInView with V6 motion presets.
 */

"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  v6StaggerContainer,
  v6StaggerItem,
  v6ViewportOnce,
  v6Easing,
} from "@/lib/motion";

// ============================================
// V6 SCROLL REVEAL VARIANTS
// ============================================

/** Single element fade in from below */
export const v6RevealUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: v6Easing.default },
  },
};

/** Fade in from left */
export const v6RevealLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.55, ease: v6Easing.default },
  },
};

/** Fade in from right */
export const v6RevealRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.55, ease: v6Easing.default },
  },
};

/** Scale in with fade */
export const v6RevealScale: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.45, ease: v6Easing.default },
  },
};

// ============================================
// SCROLL REVEAL COMPONENTS
// ============================================

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Animation direction */
  direction?: "up" | "left" | "right" | "scale";
  /** Delay before animation starts (in seconds) */
  delay?: number;
  /** Duration of animation (in seconds) */
  duration?: number;
  /** Override default viewport margin */
  margin?: string;
  /** HTML element type */
  as?: "div" | "section" | "article" | "header" | "footer" | "aside" | "main";
}

/**
 * ScrollReveal - Single element reveal on scroll
 *
 * @example
 * <ScrollReveal direction="up">
 *   <Card>Content</Card>
 * </ScrollReveal>
 */
export function ScrollReveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration,
  margin,
  as = "div",
}: ScrollRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const MotionComponent = motion[as];

  const variants: Record<string, Variants> = {
    up: v6RevealUp,
    left: v6RevealLeft,
    right: v6RevealRight,
    scale: v6RevealScale,
  };

  const selectedVariant = variants[direction];

  // Create custom variant with delay and duration overrides
  const customVariant: Variants = duration
    ? {
        hidden: selectedVariant.hidden,
        visible: {
          ...selectedVariant.visible,
          transition: {
            ...(typeof selectedVariant.visible === "object" &&
            "transition" in selectedVariant.visible
              ? selectedVariant.visible.transition
              : {}),
            delay,
            duration,
          },
        },
      }
    : {
        hidden: selectedVariant.hidden,
        visible: {
          ...selectedVariant.visible,
          transition: {
            ...(typeof selectedVariant.visible === "object" &&
            "transition" in selectedVariant.visible
              ? selectedVariant.visible.transition
              : {}),
            delay,
          },
        },
      };

  if (prefersReducedMotion) {
    const Component = as;
    return <Component className={className}>{children}</Component>;
  }

  return (
    <MotionComponent
      variants={customVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: margin || v6ViewportOnce.viewport.margin }}
      className={className}
    >
      {children}
    </MotionComponent>
  );
}

// ============================================
// STAGGER REVEAL CONTAINER
// ============================================

interface StaggerRevealProps {
  children: ReactNode;
  className?: string;
  /** Delay between each child animation (in seconds) */
  staggerDelay?: number;
  /** Initial delay before animation starts (in seconds) */
  initialDelay?: number;
  /** Override default viewport margin */
  margin?: string;
  /** HTML element type */
  as?: "div" | "section" | "ul" | "ol" | "article" | "header" | "footer";
}

/**
 * StaggerReveal - Container for staggered child animations
 *
 * Use with StaggerRevealItem for children.
 *
 * @example
 * <StaggerReveal>
 *   <StaggerRevealItem>Item 1</StaggerRevealItem>
 *   <StaggerRevealItem>Item 2</StaggerRevealItem>
 *   <StaggerRevealItem>Item 3</StaggerRevealItem>
 * </StaggerReveal>
 */
export function StaggerReveal({
  children,
  className,
  staggerDelay = 0.08,
  initialDelay = 0.1,
  margin,
  as = "div",
}: StaggerRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const MotionComponent = motion[as];

  const customContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: initialDelay,
      },
    },
  };

  if (prefersReducedMotion) {
    const Component = as;
    return <Component className={className}>{children}</Component>;
  }

  return (
    <MotionComponent
      variants={customContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: margin || v6ViewportOnce.viewport.margin }}
      className={className}
    >
      {children}
    </MotionComponent>
  );
}

// ============================================
// STAGGER REVEAL ITEM
// ============================================

interface StaggerRevealItemProps {
  children: ReactNode;
  className?: string;
  /** Animation direction */
  direction?: "up" | "left" | "right" | "scale";
  /** HTML element type */
  as?: "div" | "li" | "article" | "span";
}

/**
 * StaggerRevealItem - Child item for StaggerReveal
 *
 * @example
 * <StaggerReveal>
 *   <StaggerRevealItem>Item 1</StaggerRevealItem>
 *   <StaggerRevealItem>Item 2</StaggerRevealItem>
 * </StaggerReveal>
 */
export function StaggerRevealItem({
  children,
  className,
  direction = "up",
  as = "div",
}: StaggerRevealItemProps) {
  const prefersReducedMotion = useReducedMotion();
  const MotionComponent = motion[as];

  const variants: Record<string, Variants> = {
    up: v6StaggerItem,
    left: v6RevealLeft,
    right: v6RevealRight,
    scale: v6RevealScale,
  };

  if (prefersReducedMotion) {
    const Component = as;
    return <Component className={className}>{children}</Component>;
  }

  return (
    <MotionComponent variants={variants[direction]} className={className}>
      {children}
    </MotionComponent>
  );
}

// ============================================
// GRID STAGGER REVEAL
// ============================================

interface GridStaggerRevealProps {
  children: ReactNode;
  className?: string;
  /** Base delay between items */
  baseDelay?: number;
  /** Maximum delay (caps stagger for long lists) */
  maxDelay?: number;
  /** Override default viewport margin */
  margin?: string;
}

/**
 * GridStaggerReveal - Grid container with staggered reveal
 *
 * Automatically caps stagger delay for long lists.
 *
 * @example
 * <GridStaggerReveal className="grid grid-cols-3 gap-4">
 *   {items.map((item) => (
 *     <Card key={item.id}>{item.name}</Card>
 *   ))}
 * </GridStaggerReveal>
 */
export function GridStaggerReveal({
  children,
  className,
  baseDelay: _baseDelay = 0.08,
  maxDelay: _maxDelay = 0.64,
  margin,
}: GridStaggerRevealProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={v6StaggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: margin || v6ViewportOnce.viewport.margin }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Re-export V6 motion presets for convenience
export {
  v6StaggerContainer,
  v6StaggerItem,
  v6ViewportOnce,
} from "@/lib/motion";
