"use client";

import { useState } from "react";
import { m } from "framer-motion";

import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// Brand + tier palette (token classes only).
const COLORS = [
  "bg-primary",
  "bg-accent-orange",
  "bg-accent-green",
  "bg-accent-teal",
  "bg-magenta",
  "bg-secondary",
];
const PIECE_COUNT = 40;

interface Piece {
  left: number;
  delay: number;
  duration: number;
  xDrift: number;
  rotate: number;
  color: string;
  width: number;
  height: number;
}

function makePieces(): Piece[] {
  return Array.from({ length: PIECE_COUNT }, (_, i) => {
    const size = 6 + Math.round(Math.random() * 6);
    return {
      left: Math.random() * 100,
      delay: Math.random() * 0.25,
      duration: 1.6 + Math.random() * 1.3,
      xDrift: (Math.random() - 0.5) * 180,
      rotate: Math.random() * 720 - 360,
      color: COLORS[i % COLORS.length],
      width: size,
      height: Math.round(size * 1.6),
    };
  });
}

/**
 * One-shot celebratory confetti burst — dep-free, brand/tier colored, and a
 * no-op under reduced-motion. Absolutely positioned; drop inside a relative
 * container. Pieces are generated once so re-renders don't reshuffle them.
 */
export function Confetti() {
  const { shouldAnimate } = useAnimationPreference();
  const [pieces] = useState(makePieces);

  if (!shouldAnimate) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <m.span
          key={i}
          className={cn("absolute top-0 rounded-sm", p.color)}
          style={{ left: `${p.left}%`, width: p.width, height: p.height }}
          initial={{ y: -24, opacity: 0, rotate: 0 }}
          animate={{ y: "130%", x: p.xDrift, rotate: p.rotate, opacity: [0, 1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

export default Confetti;
