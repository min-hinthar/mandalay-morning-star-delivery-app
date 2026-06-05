"use client";

import React from "react";
import { m } from "framer-motion";
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
  /** Dish/ingredient name shown on hover */
  name?: string;
  /** Live pointer position within the hero (percent 0–100) for cursor-gather */
  pointer?: { x: number; y: number } | null;
  /** Tap handler (viewport coords) — triggers the particle burst */
  onTap?: (clientX: number, clientY: number) => void;
  /** Hide on mobile (display:none below md) to cut GPU/memory on small screens */
  mobileHidden?: boolean;
  /** Index for animation delay staggering */
  index: number;
}

export interface EmojiConfig {
  emoji: string;
  name: string;
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

// Seamless looping keyframes (start === end) — opacity handled by depth styles so
// emojis float continuously instead of fading out and stopping.
const DRIFT_ANIMATION = {
  x: [0, 22, -14, 8, 0],
  y: [0, -28, 14, -8, 0],
  scale: [1, 1.06, 0.98, 1.03, 1],
};

const SPIRAL_ANIMATION = {
  x: [0, 26, 0, -26, 0],
  y: [0, -20, -38, -20, 0],
  rotate: [0, 12, 0, -12, 0],
  scale: [1, 1.05, 1, 1.05, 1],
};

const BOB_ANIMATION = {
  y: [0, -32, 0, -16, 0],
  scale: [1, 1.09, 1, 1.04, 1],
  rotate: [0, 4, -4, 2, 0],
};

const getAnimationVariant = (type: AnimationType, index: number) => {
  // Add per-emoji variation based on index for more organic feel
  const variation = (index % 5) * 3;
  switch (type) {
    case "drift":
      return {
        ...DRIFT_ANIMATION,
        x: DRIFT_ANIMATION.x.map((v) => v + (index % 2 === 0 ? variation : -variation)),
      };
    case "spiral":
      return {
        ...SPIRAL_ANIMATION,
        rotate: SPIRAL_ANIMATION.rotate.map((v) => v + (index % 3 === 0 ? 5 : -5)),
      };
    case "bob":
      return {
        ...BOB_ANIMATION,
        y: BOB_ANIMATION.y.map((v) => v - variation),
      };
    default:
      return DRIFT_ANIMATION;
  }
};

// Animation durations - longer since they play a limited number of times
const getAnimationDuration = (type: AnimationType, index: number): number => {
  const baseDurations: Record<AnimationType, number> = {
    drift: 14,
    spiral: 18,
    bob: 10,
  };
  // Stagger duration based on index for variety
  return baseDurations[type] + (index % 4) * 2;
};

// ============================================
// EMOJI CONFIGURATION (DETERMINISTIC)
// ============================================

// 13 unique emojis with deterministic positions to avoid hydration mismatch
// Each emoji appears exactly once across all layers
// Distribution: 4 far, 5 mid, 4 near
export const EMOJI_CONFIG: EmojiConfig[] = [
  // Far layer - small, blurred, lower opacity
  { emoji: "🍜", name: "Mohinga", size: "sm", depth: "far", animationType: "drift", initialX: 8, initialY: 14 }, // prettier-ignore
  { emoji: "🥟", name: "Samusa", size: "sm", depth: "far", animationType: "bob", initialX: 85, initialY: 24 }, // prettier-ignore
  { emoji: "🍲", name: "Ohn No Khao Swè", size: "sm", depth: "far", animationType: "spiral", initialX: 18, initialY: 72 }, // prettier-ignore
  { emoji: "🌶️", name: "Balachaung", size: "sm", depth: "far", animationType: "drift", initialX: 76, initialY: 80 }, // prettier-ignore
  { emoji: "🍤", name: "Prawn Curry", size: "sm", depth: "far", animationType: "bob", initialX: 40, initialY: 88 }, // prettier-ignore
  { emoji: "🫘", name: "Pè Byouk", size: "sm", depth: "far", animationType: "spiral", initialX: 58, initialY: 10 }, // prettier-ignore

  // Mid layer - medium size, slight blur
  { emoji: "🍛", name: "Chicken Curry", size: "md", depth: "mid", animationType: "spiral", initialX: 12, initialY: 44 }, // prettier-ignore
  { emoji: "🥢", name: "Khao Swè", size: "md", depth: "mid", animationType: "bob", initialX: 92, initialY: 55 }, // prettier-ignore
  { emoji: "🫕", name: "Burmese Hotpot", size: "md", depth: "mid", animationType: "drift", initialX: 33, initialY: 20 }, // prettier-ignore
  { emoji: "🥘", name: "Pork Curry", size: "md", depth: "mid", animationType: "spiral", initialX: 66, initialY: 68 }, // prettier-ignore
  { emoji: "🍚", name: "Coconut Rice", size: "md", depth: "mid", animationType: "bob", initialX: 50, initialY: 84 }, // prettier-ignore
  { emoji: "🍢", name: "Grilled Skewers", size: "md", depth: "mid", animationType: "drift", initialX: 95, initialY: 80 }, // prettier-ignore

  // Near layer - large, crisp, full opacity
  { emoji: "🥗", name: "Lahpet Thoke", size: "lg", depth: "near", animationType: "bob", initialX: 5, initialY: 58 }, // prettier-ignore
  { emoji: "🍵", name: "Lahpet Yay", size: "lg", depth: "near", animationType: "drift", initialX: 88, initialY: 40 }, // prettier-ignore
  { emoji: "🧄", name: "Fried Garlic", size: "lg", depth: "near", animationType: "spiral", initialX: 25, initialY: 34 }, // prettier-ignore
  { emoji: "🫚", name: "Ginger Salad", size: "lg", depth: "near", animationType: "drift", initialX: 72, initialY: 14 }, // prettier-ignore
  { emoji: "🥥", name: "Coconut", size: "lg", depth: "near", animationType: "bob", initialX: 38, initialY: 50 }, // prettier-ignore
];

// ============================================
// FLOATING EMOJI COMPONENT
// ============================================

const HOT_EMOJI = new Set(["🍜", "🍛", "🍲", "🥘", "🫕", "🍵", "🍚"]);
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/** Rising steam wisps for hot dishes */
function Steam() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -top-1 left-1/2 h-3 w-6 -translate-x-1/2"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="hero-steam absolute bottom-0 h-3 w-1 rounded-full"
          style={
            {
              left: `${i * 8}px`,
              background: "rgba(255,255,255,0.5)",
              filter: "blur(var(--blur-sm))",
              "--steam-delay": `${i * 0.5}s`,
              "--steam-dur": `${2.8 + i * 0.4}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  );
}

export function FloatingEmoji({
  emoji,
  name,
  size,
  depth,
  animationType,
  initialX,
  initialY,
  pointer,
  onTap,
  mobileHidden,
  index,
}: FloatingEmojiProps) {
  const visibility = mobileHidden ? " hidden md:block" : "";
  const { shouldAnimate } = useAnimationPreference();

  // Cursor gather — drift gently toward the pointer
  const gatherX = pointer ? clamp((pointer.x - initialX) * 0.4, -46, 46) : 0;
  const gatherY = pointer ? clamp((pointer.y - initialY) * 0.4, -46, 46) : 0;

  // Depth filter/opacity applied to the GLYPH only, so the hover label stays crisp.
  const glyphStyle: React.CSSProperties = {
    filter:
      depth === "near"
        ? `drop-shadow(var(--hero-emoji-shadow-${depth}))`
        : `blur(var(--hero-emoji-blur-${depth})) drop-shadow(var(--hero-emoji-shadow-${depth}))`,
    opacity: depth === "near" ? 1 : `var(--hero-emoji-opacity-${depth})`,
  };

  const label = name ? (
    <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full hero-surface-paper px-2 py-0.5 text-2xs font-semibold text-hero-ink opacity-0 transition-opacity duration-200 group-hover:opacity-100">
      {name}
    </span>
  ) : null;

  // Static render for reduced motion preference
  if (!shouldAnimate) {
    return (
      <span
        className={`group absolute ${SIZE_CLASSES[size]} select-none${visibility}`}
        style={{ left: `${initialX}%`, top: `${initialY}%` }}
        role="presentation"
      >
        {label}
        <span className="block" style={glyphStyle}>
          {emoji}
        </span>
      </span>
    );
  }

  const variant = getAnimationVariant(animationType, index);
  const duration = getAnimationDuration(animationType, index);
  const floatTransition = {
    duration,
    repeat: Infinity,
    repeatType: "loop" as const,
    ease: "easeInOut" as const,
    delay: index * 0.5,
  };

  return (
    <m.span
      className={`group absolute ${SIZE_CLASSES[size]} pointer-events-auto cursor-pointer select-none${visibility}`}
      style={{ left: `${initialX}%`, top: `${initialY}%` }}
      animate={{ x: gatherX, y: gatherY }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
      whileTap={{ scale: 1.5, rotate: 12 }}
      onPointerDown={onTap ? (e) => onTap(e.clientX, e.clientY) : undefined}
      role="presentation"
    >
      {label}
      {/* Echo trail (behind, lagging) — only on the prominent near layer (perf) */}
      {depth === "near" && (
        <m.span
          aria-hidden="true"
          className="absolute inset-0 block opacity-25"
          style={{ filter: "blur(var(--blur-sm))" }}
          animate={variant}
          transition={{ ...floatTransition, delay: index * 0.5 + 0.45 }}
        >
          {emoji}
        </m.span>
      )}
      {/* Main float */}
      <m.span
        className="relative block"
        style={glyphStyle}
        animate={variant}
        transition={floatTransition}
      >
        {HOT_EMOJI.has(emoji) && <Steam />}
        {emoji}
      </m.span>
    </m.span>
  );
}

export default FloatingEmoji;
