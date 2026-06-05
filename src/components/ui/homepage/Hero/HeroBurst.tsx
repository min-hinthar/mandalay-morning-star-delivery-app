"use client";

/**
 * Reusable particle burst — food-sparkle glyphs that fly outward and fade.
 * `useBurst().fire(x, y)` spawns a burst at container-relative coords; render
 * <Bursts> inside a relative, clipped overlay. Powers emoji taps + CTA bursts.
 */

import { useCallback, useRef, useState } from "react";
import { m } from "framer-motion";

const COLORS = ["var(--hero-clay)", "var(--hero-blue)", "var(--hero-sage)", "#f59e0b"];
const CHARS = ["✦", "✧", "✶", "·"];

interface BurstParticle {
  id: number;
  dx: number;
  dy: number;
  size: number;
  color: string;
  char: string;
  rot: number;
}

interface BurstInstance {
  id: number;
  x: number;
  y: number;
  particles: BurstParticle[];
}

function makeParticles(seed: number, count: number): BurstParticle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (seed % 7) * 0.31;
    const dist = 26 + ((seed * 7 + i * 13) % 30);
    return {
      id: i,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist,
      size: 7 + ((i * 5) % 9),
      color: COLORS[(i + seed) % COLORS.length],
      char: CHARS[(i + seed) % CHARS.length],
      rot: ((i * 47) % 90) - 45,
    };
  });
}

export function useBurst(count = 9) {
  const [bursts, setBursts] = useState<BurstInstance[]>([]);
  const next = useRef(0);

  const fire = useCallback(
    (x: number, y: number) => {
      const id = next.current++;
      setBursts((prev) => [...prev, { id, x, y, particles: makeParticles(id, count) }]);
      window.setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== id)), 900);
    },
    [count]
  );

  return { bursts, fire };
}

export function Bursts({
  bursts,
}: {
  bursts: { id: number; x: number; y: number; particles: BurstParticle[] }[];
}) {
  return (
    <>
      {bursts.map((b) => (
        <span
          key={b.id}
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{ left: b.x, top: b.y }}
        >
          {b.particles.map((p) => (
            <m.span
              key={p.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 select-none leading-none"
              style={{ color: p.color, fontSize: p.size }}
              initial={{ opacity: 1, x: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 0, x: p.dx, y: p.dy, scale: 1.1, rotate: p.rot }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {p.char}
            </m.span>
          ))}
        </span>
      ))}
    </>
  );
}
