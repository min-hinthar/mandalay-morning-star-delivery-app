"use client";

/**
 * HeroConfetti — one-time welcome sprinkle of tiny food bits on first hero load
 * (once per session). Reduced-motion safe.
 */

import { useEffect, useMemo, useState } from "react";
import { m } from "framer-motion";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

const BITS = ["🌶️", "🍃", "✨", "✦"];
const COLORS = ["var(--hero-clay)", "var(--hero-blue)", "var(--hero-sage)", "#f59e0b"];

export function HeroConfetti() {
  const { shouldAnimate } = useAnimationPreference();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!shouldAnimate) return;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("heroConfetti")) return;
    sessionStorage.setItem("heroConfetti", "1");
    setShow(true);
    const t = window.setTimeout(() => setShow(false), 2800);
    return () => window.clearTimeout(t);
  }, [shouldAnimate]);

  const pieces = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        x: (i * 37) % 100,
        glyph: BITS[i % BITS.length],
        color: COLORS[i % COLORS.length],
        size: 12 + ((i * 7) % 12),
        dur: 2 + ((i * 13) % 12) / 10,
        delay: ((i * 17) % 10) / 10,
        rot: ((i * 53) % 240) - 120,
        drift: ((i % 5) - 2) * 14,
      })),
    []
  );

  if (!show) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-[110vh] overflow-hidden"
      // eslint-disable-next-line no-restricted-syntax -- transient confetti above hero content
      style={{ zIndex: 6 }}
    >
      {pieces.map((p) => (
        <m.span
          key={p.id}
          className="absolute select-none leading-none"
          style={{ left: `${p.x}%`, top: -24, fontSize: p.size, color: p.color }}
          initial={{ y: -24, x: 0, opacity: 0, rotate: 0 }}
          animate={{ y: "112vh", x: p.drift, opacity: [0, 1, 1, 0], rotate: p.rot }}
          transition={{ duration: p.dur, delay: p.delay, ease: "easeIn" }}
        >
          {p.glyph}
        </m.span>
      ))}
    </div>
  );
}
