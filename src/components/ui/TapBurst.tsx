"use client";

/**
 * TapBurst — a one-shot triad-particle burst for celebratory taps (add-to-cart,
 * reward unlock, profile save, sign-in success). Level-up kit primitive.
 *
 * Usage: `const { fireKey, fire } = useTapBurst()`, call `fire()` on the happy
 * action, and render `<TapBurst fireKey={fireKey} />` inside a `relative` parent.
 * Each `fire()` bumps `fireKey`, remounting the burst so it replays. Decorative +
 * a11y-inert; no-ops under reduced motion (returns null). Transform/opacity only.
 */

import { useCallback, useState } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// Triad + amber particles spread around the origin (angle°, distance px, color).
const PARTICLES = [
  { a: -90, d: 34, c: "bg-amber-400" },
  { a: -40, d: 30, c: "bg-hero-clay" },
  { a: 10, d: 36, c: "bg-hero-gold" },
  { a: 55, d: 30, c: "bg-hero-sage" },
  { a: 100, d: 34, c: "bg-hero-blue" },
  { a: 150, d: 30, c: "bg-hero-clay" },
  { a: 195, d: 36, c: "bg-amber-400" },
  { a: 235, d: 30, c: "bg-hero-gold" },
];

export function useTapBurst() {
  const [count, setCount] = useState(0);
  const fire = useCallback(() => setCount((c) => c + 1), []);
  // null until the first fire(), so nothing renders on mount.
  return { fireKey: count || null, fire };
}

export function TapBurst({
  fireKey,
  className,
}: {
  fireKey: number | string | null;
  className?: string;
}) {
  const { shouldAnimate } = useAnimationPreference();
  if (!shouldAnimate || fireKey == null) return null;

  return (
    <span
      key={String(fireKey)}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 flex items-center justify-center",
        className
      )}
    >
      {PARTICLES.map((p, i) => {
        const rad = (p.a * Math.PI) / 180;
        return (
          <m.span
            key={i}
            className={cn("absolute h-1.5 w-1.5 rounded-full", p.c)}
            initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            animate={{
              opacity: 0,
              scale: 0.3,
              x: Math.cos(rad) * p.d,
              y: Math.sin(rad) * p.d,
            }}
            transition={{ duration: 0.6, delay: i * 0.02, ease: "easeOut" }}
          />
        );
      })}
    </span>
  );
}

export default TapBurst;
