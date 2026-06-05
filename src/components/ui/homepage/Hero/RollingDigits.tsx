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
    <span className="relative inline-flex h-[1.05em] w-[0.6em] overflow-hidden align-baseline tabular-nums">
      <m.span
        className="absolute left-0 top-0 flex w-full flex-col"
        style={{ height: "1000%" }}
        initial={{ y: "0%" }}
        animate={{ y: `-${digit * 10}%` }}
        transition={ROLL_SPRING}
      >
        {DIGITS.map((d) => (
          <span key={d} className="flex h-[10%] items-center justify-center leading-none">
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
