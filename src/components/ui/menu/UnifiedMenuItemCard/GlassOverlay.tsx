"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { zClass } from "@/lib/design-system/tokens/z-index";

// ============================================
// TYPES
// ============================================

export interface GlassOverlayProps {
  /** Whether card is hovered */
  isHovered: boolean;
  /** Border radius class */
  rounded?: string;
  /** Additional className */
  className?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * GlassOverlay - Glassmorphism surface layer with hover glow
 *
 * Renders the frosted glass background effect with brand color
 * border glow on hover.
 */
export function GlassOverlay({
  isHovered,
  rounded = "rounded-3xl",
  className,
}: GlassOverlayProps) {
  const { shouldAnimate } = useAnimationPreference();

  return (
    <div className={cn("absolute inset-0 pointer-events-none", zClass.base, rounded, className)}>
      {/* Base glass surface */}
      <div
        className={cn(
          "absolute inset-0 glass-menu-card",
          rounded
        )}
      />

      {/* Hover border glow - brand color */}
      {shouldAnimate && (
        <motion.div
          className={cn(
            "absolute inset-0 pointer-events-none",
            rounded,
            "border-2 border-primary/0"
          )}
          animate={{
            borderColor: isHovered
              ? "rgba(var(--color-primary-rgb, 164 16 52) / 0.5)"
              : "rgba(var(--color-primary-rgb, 164 16 52) / 0)",
            boxShadow: isHovered
              ? "0 0 20px rgba(164, 16, 52, 0.15), inset 0 0 30px rgba(164, 16, 52, 0.05)"
              : "0 0 0px rgba(164, 16, 52, 0), inset 0 0 0px rgba(164, 16, 52, 0)",
          }}
          transition={{ duration: 0.3 }}
        />
      )}
    </div>
  );
}

export default GlassOverlay;
