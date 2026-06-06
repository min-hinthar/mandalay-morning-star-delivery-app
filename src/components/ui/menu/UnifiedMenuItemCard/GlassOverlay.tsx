"use client";

import { memo } from "react";
import { m } from "framer-motion";
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
  /** Deepened-sunset treatment — warm ember hover glow instead of brand red */
  nocturne?: boolean;
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
export const GlassOverlay = memo(function GlassOverlay({
  isHovered,
  rounded = "rounded-3xl",
  nocturne = false,
  className,
}: GlassOverlayProps) {
  const { shouldAnimate } = useAnimationPreference();

  // Hover glow palette: warm clay/ember for nocturne, else brand red.
  // (The surface border + box-shadow lift come from CSS; this layer adds
  // the soft colored bloom that Framer can interpolate.)
  const glow = nocturne
    ? {
        on: "rgba(217, 119, 87, 0.55)",
        offBorder: "rgba(217, 119, 87, 0)",
        onShadow: "0 0 22px rgba(217, 119, 87, 0.22), inset 0 0 34px rgba(234, 169, 47, 0.06)",
        offShadow: "0 0 0px rgba(217, 119, 87, 0), inset 0 0 0px rgba(234, 169, 47, 0)",
        borderClass: "border-2 border-hero-clay/0",
      }
    : {
        on: "rgba(var(--color-primary-rgb, 164 16 52) / 0.5)",
        offBorder: "rgba(var(--color-primary-rgb, 164 16 52) / 0)",
        onShadow: "0 0 20px rgba(164, 16, 52, 0.15), inset 0 0 30px rgba(164, 16, 52, 0.05)",
        offShadow: "0 0 0px rgba(164, 16, 52, 0), inset 0 0 0px rgba(164, 16, 52, 0)",
        borderClass: "border-2 border-primary/0",
      };

  return (
    <div
      className={cn("absolute inset-0 pointer-events-none", zClass.base, rounded, className)}
      style={{ isolation: "isolate" }}
    >
      {/* Base glass surface */}
      <div
        className={cn("absolute inset-0 glass-menu-card", rounded)}
        style={{
          overflow: "hidden",
          // Safari backface fix
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
        }}
      />

      {/* Hover border glow - brand color, ~--shadow-glow-primary equivalent */}
      {shouldAnimate && (
        <m.div
          className={cn("absolute inset-0 pointer-events-none", rounded, glow.borderClass)}
          // Kept numeric for FM interpolation between hovered/unhovered states
          animate={{
            borderColor: isHovered ? glow.on : glow.offBorder,
            boxShadow: isHovered ? glow.onShadow : glow.offShadow,
          }}
          transition={{ duration: 0.3 }}
        />
      )}
    </div>
  );
});

export default GlassOverlay;
