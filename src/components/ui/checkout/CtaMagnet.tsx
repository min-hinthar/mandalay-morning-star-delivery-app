"use client";

/**
 * CtaMagnet — wraps a checkout CTA with two tactile micro-interactions:
 * a magnetic pull toward the pointer (desktop hover) and a tap ripple from the
 * touch point. Both no-op under reduced motion. Inline-flex so it preserves the
 * button's natural width inside the step footers. Ripple clips to rounded-button
 * (the shared Button radius) and is pointer-events-none so clicks pass through.
 */

import type { ReactNode } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { useMagnetic, useRipple } from "@/components/ui/homepage/Hero/interactions";

export function CtaMagnet({ children, className }: { children: ReactNode; className?: string }) {
  const { x, y, onPointerMove, onPointerLeave, enabled } = useMagnetic(0.22);
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
      <span className="rounded-button pointer-events-none absolute inset-0 overflow-hidden">
        {ripples.map((r) => (
          <m.span
            key={r.id}
            aria-hidden="true"
            className="absolute rounded-full bg-hero-card/40"
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

export default CtaMagnet;
