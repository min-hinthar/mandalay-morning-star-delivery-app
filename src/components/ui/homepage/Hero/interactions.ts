"use client";

/**
 * Hero pointer micro-interactions — tilt + magnetic pull.
 * Both respect the user's reduced-motion preference (no-op when disabled).
 */

import type { PointerEvent as ReactPointerEvent } from "react";
import { useSpring } from "framer-motion";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

type ReactPointer = ReactPointerEvent<HTMLElement>;

const TILT_SPRING = { stiffness: 220, damping: 18, mass: 0.4 } as const;
const MAGNET_SPRING = { stiffness: 240, damping: 16, mass: 0.4 } as const;

/**
 * 3D parallax tilt driven by pointer position over the element.
 * Spread the returned `rotateX`/`rotateY` onto an `m.div` style
 * (with `transformPerspective`) and bind the handlers.
 */
export function useTilt(maxDeg = 7) {
  const { shouldAnimate } = useAnimationPreference();
  const rotateX = useSpring(0, TILT_SPRING);
  const rotateY = useSpring(0, TILT_SPRING);

  function onPointerMove(e: ReactPointer) {
    if (!shouldAnimate) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    rotateY.set(px * maxDeg * 2);
    rotateX.set(-py * maxDeg * 2);
  }

  function onPointerLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return { rotateX, rotateY, onPointerMove, onPointerLeave, enabled: shouldAnimate };
}

/**
 * Magnetic pull — element leans toward the pointer while hovered.
 * Spread `x`/`y` onto an `m.*` style and bind the handlers.
 */
export function useMagnetic(strength = 0.35) {
  const { shouldAnimate } = useAnimationPreference();
  const x = useSpring(0, MAGNET_SPRING);
  const y = useSpring(0, MAGNET_SPRING);

  function onPointerMove(e: ReactPointer) {
    if (!shouldAnimate) return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  }

  function onPointerLeave() {
    x.set(0);
    y.set(0);
  }

  return { x, y, onPointerMove, onPointerLeave, enabled: shouldAnimate };
}
