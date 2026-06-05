"use client";

/**
 * HeroCountdown — odometer-style delivery countdown.
 * Rolling digit reels for H / M / S (seconds tick every second). Falls back to
 * static digits under reduced motion. Used only in the hero; the shared compact
 * DeliveryCountdown stays unchanged.
 */

import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { useCountdown } from "@/lib/hooks/useCountdown";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import type { Urgency } from "@/lib/hooks/useDeliveryGate";

const DIGITS = Array.from({ length: 10 }, (_, d) => d);

function RollingDigit({ digit, animate }: { digit: number; animate: boolean }) {
  if (!animate) return <span className="tabular-nums">{digit}</span>;
  return (
    <span className="relative inline-flex h-[1.05em] w-[0.6em] overflow-hidden align-baseline tabular-nums">
      <m.span
        className="absolute left-0 top-0 flex w-full flex-col"
        style={{ height: "1000%" }}
        animate={{ y: `-${digit * 10}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
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

function Reel({ value, pad, animate }: { value: number; pad: number; animate: boolean }) {
  const chars = String(value).padStart(pad, "0").split("");
  return (
    <span className="inline-flex">
      {chars.map((ch, i) => (
        <RollingDigit key={i} digit={Number(ch)} animate={animate} />
      ))}
    </span>
  );
}

export interface HeroCountdownProps {
  cutoffDate: Date;
  urgency: Urgency;
  className?: string;
}

export function HeroCountdown({ cutoffDate, urgency, className }: HeroCountdownProps) {
  const { shouldAnimate } = useAnimationPreference();
  const c = useCountdown(cutoffDate, "cutoff");

  if (c.isPast) return null;

  const tone =
    urgency === "critical"
      ? "text-hero-accent"
      : urgency === "warning"
        ? "text-amber-600"
        : "text-hero-ink";
  const unit = "px-0.5 text-[0.6em] font-semibold uppercase tracking-wide text-hero-ink-muted";

  return (
    <span
      className={cn("inline-flex items-baseline font-mono font-bold", tone, className)}
      role="timer"
    >
      <span className="sr-only">
        {c.hours > 0 ? `${c.hours} hours ` : ""}
        {c.minutes} minutes until order cutoff
      </span>
      <span aria-hidden="true" className="inline-flex items-baseline">
        {c.hours > 0 && (
          <>
            <Reel value={c.hours} pad={1} animate={shouldAnimate} />
            <span className={unit}>h</span>
          </>
        )}
        <Reel value={c.minutes} pad={2} animate={shouldAnimate} />
        <span className={unit}>m</span>
        <Reel value={c.seconds} pad={2} animate={shouldAnimate} />
        <span className={unit}>s</span>
      </span>
    </span>
  );
}
