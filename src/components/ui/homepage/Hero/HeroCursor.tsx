"use client";

/**
 * HeroCursor — additive clay dot + trailing ring that follows the pointer and
 * grows over interactive targets. Desktop/fine-pointer only; respects reduced
 * motion. Does not hide the system cursor (kept for usability).
 */

import { useEffect, useState } from "react";
import { m, useMotionValue, useSpring } from "framer-motion";
import { useCanHover } from "@/lib/hooks/useResponsive";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

export function HeroCursor() {
  const canHover = useCanHover();
  const { shouldAnimate } = useAnimationPreference();
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const dotX = useSpring(x, { stiffness: 600, damping: 40 });
  const dotY = useSpring(y, { stiffness: 600, damping: 40 });
  const ringX = useSpring(x, { stiffness: 170, damping: 20 });
  const ringY = useSpring(y, { stiffness: 170, damping: 20 });
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);

  const enabled = canHover && shouldAnimate;

  useEffect(() => {
    if (!enabled) return;
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const el = e.target as HTMLElement | null;
      setHovering(!!el?.closest("a,button,[role='button'],input,select,textarea,[data-cursor]"));
    };
    const leave = () => setVisible(false);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerleave", leave);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 transition-opacity duration-300"
      // eslint-disable-next-line no-restricted-syntax -- global cursor overlay, must sit above all content
      style={{ zIndex: 70, opacity: visible ? 1 : 0 }}
    >
      <m.span
        className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-hero-clay"
        style={{ left: dotX, top: dotY }}
      />
      <m.span
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-hero-clay/60"
        style={{ left: ringX, top: ringY }}
        animate={{ width: hovering ? 50 : 28, height: hovering ? 50 : 28 }}
        transition={{ type: "spring", stiffness: 250, damping: 20 }}
      />
    </div>
  );
}
