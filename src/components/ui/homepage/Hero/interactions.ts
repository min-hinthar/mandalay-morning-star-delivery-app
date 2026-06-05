"use client";

/**
 * Hero pointer micro-interactions — tilt, magnetic pull, pointer/gyro parallax,
 * tap ripples. All respect the user's reduced-motion preference (no-op when off).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useSpring, type MotionValue } from "framer-motion";
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

const PARALLAX_SPRING = { stiffness: 90, damping: 22, mass: 0.6 } as const;

/**
 * Hero-wide parallax source: normalized (-0.5..0.5) offsets driven by pointer
 * position over `ref`, page scroll, and device orientation (gyro) on mobile.
 * Decorative layers multiply these by a depth factor.
 */
export function useHeroParallax(ref: React.RefObject<HTMLElement | null>): {
  x: MotionValue<number>;
  y: MotionValue<number>;
  scrollY: MotionValue<number>;
} {
  const { shouldAnimate } = useAnimationPreference();
  const x = useSpring(0, PARALLAX_SPRING);
  const y = useSpring(0, PARALLAX_SPRING);
  const scrollY = useSpring(0, PARALLAX_SPRING);
  const frame = useRef(0);

  useEffect(() => {
    if (!shouldAnimate) return;

    const onPointer = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        x.set((e.clientX - (r.left + r.width / 2)) / r.width);
        y.set((e.clientY - (r.top + r.height / 2)) / r.height);
      });
    };

    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      scrollY.set(-el.getBoundingClientRect().top);
    };

    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      // gamma: left/right (-90..90), beta: front/back (-180..180)
      x.set(Math.max(-0.5, Math.min(0.5, e.gamma / 45)));
      y.set(Math.max(-0.5, Math.min(0.5, (e.beta - 45) / 45)));
    };

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("deviceorientation", onOrient, { passive: true });
    onScroll();

    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("deviceorientation", onOrient);
    };
  }, [ref, x, y, scrollY, shouldAnimate]);

  return { x, y, scrollY };
}

export interface Ripple {
  id: number;
  x: number;
  y: number;
}

/**
 * Tap/click ripple. Bind `onPointerDown` to the target; render `ripples` as
 * absolutely-positioned expanding spans. Works on touch + mouse.
 */
export function useRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const nextId = useRef(0);

  const onPointerDown = useCallback((e: ReactPointer) => {
    const r = e.currentTarget.getBoundingClientRect();
    const id = nextId.current++;
    setRipples((prev) => [...prev, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((rp) => rp.id !== id));
    }, 650);
  }, []);

  return { ripples, onPointerDown };
}
