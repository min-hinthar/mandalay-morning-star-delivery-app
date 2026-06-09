"use client";

/**
 * MagneticButton — shared After Dark micro-interaction wrapper.
 *
 * Two tactile effects on any CTA: a magnetic pull toward the pointer (desktop
 * hover) + a tap ripple from the touch point. Both no-op under reduced motion
 * (via the hero `useMagnetic`/`useRipple` hooks). Inline-flex so it preserves
 * the wrapped control's natural width; the ripple clips to `radiusClass` and is
 * pointer-events-none so clicks pass through to the child.
 *
 * Promoted from checkout's `CtaMagnet` (which now delegates here) so every
 * surface's primary CTA can share the same feel.
 */

import type { ReactNode } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { useMagnetic, useRipple } from "@/components/ui/homepage/Hero/interactions";

export interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  /** Magnetic pull strength (0 disables the pull, ripple still fires). Default 0.22. */
  strength?: number;
  /** Tailwind rounded-* class the ripple overflow clips to. Default `rounded-button`. */
  radiusClass?: string;
  /** Ripple fill utility. Default `bg-hero-card/40` (warm cream). */
  rippleClass?: string;
}

export function MagneticButton({
  children,
  className,
  strength = 0.22,
  radiusClass = "rounded-button",
  rippleClass = "bg-hero-card/40",
}: MagneticButtonProps) {
  const { x, y, onPointerMove, onPointerLeave, enabled } = useMagnetic(strength);
  const { ripples, onPointerDown } = useRipple();

  return (
    <m.span
      className={cn("relative inline-flex", className)}
      style={enabled ? { x, y } : undefined}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
    >
      {children}
      <span className={cn("pointer-events-none absolute inset-0 overflow-hidden", radiusClass)}>
        {ripples.map((r) => (
          <m.span
            key={r.id}
            aria-hidden="true"
            className={cn("absolute rounded-full", rippleClass)}
            style={{ left: r.x, top: r.y }}
            initial={{ width: 0, height: 0, x: "-50%", y: "-50%", opacity: 0.45 }}
            animate={{ width: 360, height: 360, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}
      </span>
    </m.span>
  );
}

export default MagneticButton;
