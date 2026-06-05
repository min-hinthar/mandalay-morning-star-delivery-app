"use client";

/**
 * HeroGreetingPill — standalone, lively time-of-day greeting.
 * Animated icon, live clock, breathing clay halo, magnetic pull, auto sheen
 * (mobile-friendly), and a tap ripple. Reduced-motion safe.
 */

import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { Moon, Sun, Sunrise, Sunset } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useDynamicTheme } from "@/components/ui/theme";
import { useMagnetic, useRipple } from "./interactions";

const GREETINGS = {
  morning: { en: "Good morning", icon: Sunrise },
  afternoon: { en: "Good afternoon", icon: Sun },
  evening: { en: "Good evening", icon: Sunset },
  night: { en: "Late night cravings", icon: Moon },
  dawn: { en: "Early bird", icon: Sunrise },
} as const;

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function HeroGreetingPill({ className }: { className?: string }) {
  const { shouldAnimate } = useAnimationPreference();
  const { timeOfDay } = useDynamicTheme();
  const magnet = useMagnetic(0.5);
  const { ripples, onPointerDown } = useRipple();
  const now = useClock();

  const g = GREETINGS[timeOfDay as keyof typeof GREETINGS] ?? GREETINGS.morning;
  const Icon = g.icon;
  const time = now ? now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";

  return (
    <m.div
      className={cn("relative inline-flex", className)}
      style={{ x: magnet.x, y: magnet.y }}
      onPointerMove={magnet.onPointerMove}
      onPointerLeave={magnet.onPointerLeave}
      onPointerDown={onPointerDown}
      whileHover={shouldAnimate ? { scale: 1.04 } : undefined}
      whileTap={shouldAnimate ? { scale: 0.97 } : undefined}
    >
      {/* Breathing clay halo */}
      <span
        aria-hidden="true"
        className="hero-halo-breathe pointer-events-none absolute -inset-2 rounded-full bg-hero-clay/30 blur-lg"
      />
      <span className="hero-surface-paper relative inline-flex items-center gap-2 overflow-hidden rounded-full px-4 py-2">
        {/* Auto sheen (mobile vibrance) */}
        {shouldAnimate && (
          <span
            aria-hidden="true"
            className="animate-hero-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          />
        )}
        {/* Tap ripples */}
        {ripples.map((rp) => (
          <span
            key={rp.id}
            aria-hidden="true"
            className="animate-hero-ripple pointer-events-none absolute h-16 w-16 rounded-full bg-hero-clay/25"
            style={{ left: rp.x, top: rp.y }}
          />
        ))}
        <m.span
          aria-hidden="true"
          className="relative text-hero-clay"
          animate={shouldAnimate ? { rotate: [0, 12, -8, 0] } : undefined}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Icon className="h-4 w-4" />
        </m.span>
        <span className="relative text-sm font-semibold text-hero-accent">{g.en}</span>
        {time && (
          <>
            <span className="relative text-hero-ink-muted">·</span>
            <span className="relative font-mono text-sm font-semibold tabular-nums text-hero-ink">
              {time}
            </span>
          </>
        )}
      </span>
    </m.div>
  );
}
