"use client";

/**
 * Shared odometer digit reels.
 * - RollingDigit: a single 0–9 reel that springs to its value.
 * - RollingNumber: a formatted number where digits roll and separators stay put.
 * Falls back to plain text when `animate` is false (reduced motion).
 */

import { m } from "framer-motion";

const DIGITS = Array.from({ length: 10 }, (_, d) => d);
const ROLL_SPRING = { type: "spring", stiffness: 300, damping: 30 } as const;

export function RollingDigit({ digit, animate }: { digit: number; animate: boolean }) {
  if (!animate) return <span className="tabular-nums">{digit}</span>;
  return (
    // inline-block + an invisible baseline anchor keeps the reel ON the text
    // baseline (like a plain digit), instead of riding high from centering.
    <span className="relative inline-block h-[1em] w-[0.6em] overflow-hidden align-baseline leading-none tabular-nums">
      <span aria-hidden="true" className="invisible">
        0
      </span>
      <m.span
        className="absolute inset-x-0 top-0 flex flex-col"
        style={{ height: "1000%" }}
        initial={{ y: "0%" }}
        animate={{ y: `-${digit * 10}%` }}
        transition={ROLL_SPRING}
        aria-hidden="true"
      >
        {DIGITS.map((d) => (
          <span key={d} className="block h-[10%] text-center leading-none">
            {d}
          </span>
        ))}
      </m.span>
    </span>
  );
}

interface RollingNumberProps {
  value: number;
  decimals?: number;
  animate: boolean;
}

export function RollingNumber({ value, decimals = 0, animate }: RollingNumberProps) {
  const text = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString("en-US");

  if (!animate) return <span className="tabular-nums">{text}</span>;

  return (
    <span className="inline-flex items-baseline">
      {text.split("").map((ch, i) =>
        /\d/.test(ch) ? (
          <RollingDigit key={i} digit={Number(ch)} animate />
        ) : (
          <span key={i} className="tabular-nums">
            {ch}
          </span>
        )
      )}
    </span>
  );
}
