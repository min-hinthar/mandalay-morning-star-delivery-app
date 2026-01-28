"use client";

import React from "react";
import { motion, MotionValue } from "framer-motion";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export type EmojiSize = "sm" | "md" | "lg";
export type EmojiDepth = "far" | "mid" | "near";
export type AnimationType = "drift" | "spiral" | "bob";

export interface FloatingEmojiProps {
  /** The emoji character to display */
  emoji: string;
  /** Size of the emoji */
  size: EmojiSize;
  /** Depth layer affecting blur and opacity */
  depth: EmojiDepth;
  /** Animation type for organic movement */
  animationType: AnimationType;
  /** Initial X position (0-100 percentage) */
  initialX: number;
  /** Initial Y position (0-100 percentage) */
  initialY: number;
  /** Parallax Y transform from scroll */
  parallaxY?: MotionValue<string>;
  /** Mouse offset for repel effect */
  mouseOffset?: { x: number; y: number };
  /** Index for animation delay staggering */
  index: number;
}

export interface EmojiConfig {
  emoji: string;
  size: EmojiSize;
  depth: EmojiDepth;
  animationType: AnimationType;
  initialX: number;
  initialY: number;
}

// ============================================
// SIZE CLASSES
// ============================================

const SIZE_CLASSES: Record<EmojiSize, string> = {
  sm: "text-2xl md:text-3xl", // 24-32px - far layer
  md: "text-4xl md:text-5xl", // 36-48px - mid layer
  lg: "text-5xl md:text-6xl", // 52-64px - near layer
};

// ============================================
// ANIMATION VARIANTS
// ============================================

const DRIFT_ANIMATION = {
  x: [0, 15, -10, 5, 0],
  y: [0, -20, 10, -5, 0],
};

const SPIRAL_ANIMATION = {
  x: [0, 20, 0, -20, 0],
  y: [0, -15, -30, -15, 0],
  rotate: [0, 10, 0, -10, 0],
};

const BOB_ANIMATION = {
  y: [0, -25, 0, -12, 0],
  scale: [1, 1.05, 1, 1.02, 1],
};

const getAnimationVariant = (type: AnimationType) => {
  switch (type) {
    case "drift":
      return DRIFT_ANIMATION;
    case "spiral":
      return SPIRAL_ANIMATION;
    case "bob":
      return BOB_ANIMATION;
    default:
      return DRIFT_ANIMATION;
  }
};

// Base duration varies by animation type for organic feel
const getAnimationDuration = (type: AnimationType, index: number): number => {
  const baseDurations: Record<AnimationType, number> = {
    drift: 12,
    spiral: 15,
    bob: 8,
  };
  // Stagger duration based on index for variety
  return baseDurations[type] + (index % 4) * 2;
};

// ============================================
// EMOJI CONFIGURATION (DETERMINISTIC)
// ============================================

// 13 emojis with deterministic positions to avoid hydration mismatch
// Distribution: 4 far, 5 mid, 4 near
export const EMOJI_CONFIG: EmojiConfig[] = [
  // Far layer (4 emojis) - small, blurred, lower opacity
  { emoji: "🍜", size: "sm", depth: "far", animationType: "drift", initialX: 8, initialY: 15 },
  { emoji: "🥟", size: "sm", depth: "far", animationType: "bob", initialX: 85, initialY: 25 },
  { emoji: "🍲", size: "sm", depth: "far", animationType: "spiral", initialX: 20, initialY: 75 },
  { emoji: "🌶️", size: "sm", depth: "far", animationType: "drift", initialX: 75, initialY: 80 },

  // Mid layer (5 emojis) - medium size, slight blur
  { emoji: "🥟", size: "md", depth: "mid", animationType: "spiral", initialX: 12, initialY: 45 },
  { emoji: "🍜", size: "md", depth: "mid", animationType: "bob", initialX: 92, initialY: 55 },
  { emoji: "🌶️", size: "md", depth: "mid", animationType: "drift", initialX: 35, initialY: 20 },
  { emoji: "🍲", size: "md", depth: "mid", animationType: "spiral", initialX: 65, initialY: 70 },
  { emoji: "🍜", size: "md", depth: "mid", animationType: "bob", initialX: 50, initialY: 85 },

  // Near layer (4 emojis) - large, crisp, full opacity
  { emoji: "🍲", size: "lg", depth: "near", animationType: "bob", initialX: 5, initialY: 60 },
  { emoji: "🥟", size: "lg", depth: "near", animationType: "drift", initialX: 88, initialY: 40 },
  { emoji: "🌶️", size: "lg", depth: "near", animationType: "spiral", initialX: 25, initialY: 35 },
  { emoji: "🍜", size: "lg", depth: "near", animationType: "drift", initialX: 70, initialY: 15 },
];

// ============================================
// FLOATING EMOJI COMPONENT
// ============================================

export function FloatingEmoji({
  emoji,
  size,
  depth,
  animationType,
  initialX,
  initialY,
  parallaxY,
  mouseOffset,
  index,
}: FloatingEmojiProps) {
  const { shouldAnimate } = useAnimationPreference();

  // Mouse repel effect (subtle, max 20px)
  const repelX = mouseOffset ? mouseOffset.x * 0.3 : 0;
  const repelY = mouseOffset ? mouseOffset.y * 0.3 : 0;

  // Depth-based styles using CSS variables from tokens.css
  const depthStyles: React.CSSProperties = {
    // Position
    left: `${initialX}%`,
    top: `${initialY}%`,
    // GPU acceleration
    willChange: "transform",
    transform: `translate3d(${repelX}px, ${repelY}px, 0)`,
    // Depth effects via CSS variables
    filter: depth === "near" ? "none" : `blur(var(--hero-emoji-blur-${depth}))`,
    opacity: depth === "near" ? 1 : `var(--hero-emoji-opacity-${depth})`,
    boxShadow: `var(--hero-emoji-shadow-${depth})`,
  };

  const animationVariant = getAnimationVariant(animationType);
  const animationDuration = getAnimationDuration(animationType, index);

  // Static render for reduced motion preference
  if (!shouldAnimate) {
    return (
      <span
        className={`absolute ${SIZE_CLASSES[size]} select-none`}
        style={depthStyles}
        role="presentation"
      >
        {emoji}
      </span>
    );
  }

  return (
    <motion.span
      className={`absolute ${SIZE_CLASSES[size]} select-none`}
      style={{
        ...depthStyles,
        y: parallaxY,
      }}
      animate={animationVariant}
      transition={{
        duration: animationDuration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: index * 0.5, // Stagger start times
      }}
      role="presentation"
    >
      {emoji}
    </motion.span>
  );
}

export default FloatingEmoji;
