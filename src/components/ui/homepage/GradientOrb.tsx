"use client";

import React from "react";
import { motion, MotionValue } from "framer-motion";
import { cn } from "@/lib/utils/cn";

// ============================================
// TYPES
// ============================================

export type OrbColor = "saffron" | "jade" | "ruby";

export interface GradientOrbProps {
  /** Orb color - maps to CSS variable */
  color: OrbColor;
  /** Size in pixels */
  size: number;
  /** X position (CSS value e.g., "10%", "50px") */
  x: string;
  /** Y position (CSS value e.g., "20%", "100px") */
  y: string;
  /** Parallax Y transform from scroll */
  parallaxY?: MotionValue<string>;
  /** Additional class names */
  className?: string;
}

export interface OrbConfig {
  color: OrbColor;
  size: number;
  x: string;
  y: string;
}

// ============================================
// ORB CONFIGURATIONS (DETERMINISTIC)
// ============================================

// Far layer orbs - larger, more blurred (background depth)
export const ORB_CONFIG_FAR: OrbConfig[] = [
  { color: "saffron", size: 400, x: "-5%", y: "10%" },
  { color: "jade", size: 350, x: "70%", y: "60%" },
  { color: "ruby", size: 300, x: "30%", y: "80%" },
];

// Mid layer orbs - medium size (mid-ground depth)
export const ORB_CONFIG_MID: OrbConfig[] = [
  { color: "ruby", size: 250, x: "85%", y: "20%" },
  { color: "saffron", size: 200, x: "10%", y: "50%" },
  { color: "jade", size: 220, x: "55%", y: "30%" },
];

// ============================================
// GRADIENT ORB COMPONENT
// ============================================

export function GradientOrb({
  color,
  size,
  x,
  y,
  parallaxY,
  className,
}: GradientOrbProps) {
  // Use CSS variables for theme-aware colors
  // --hero-orb-saffron, --hero-orb-jade, --hero-orb-ruby
  // --hero-orb-blur: 60px (light) / 80px (dark)
  const orbStyles: React.CSSProperties = {
    width: size,
    height: size,
    left: x,
    top: y,
    // Radial gradient from orb color to transparent
    background: `radial-gradient(circle, var(--hero-orb-${color}) 0%, transparent 70%)`,
    // Theme-aware blur (larger in dark mode)
    filter: `blur(var(--hero-orb-blur))`,
    // GPU acceleration
    willChange: "transform",
    transform: "translate3d(0, 0, 0)",
  };

  return (
    <motion.div
      className={cn("absolute rounded-full pointer-events-none", className)}
      style={{
        ...orbStyles,
        y: parallaxY,
      }}
      aria-hidden="true"
    />
  );
}

export default GradientOrb;
