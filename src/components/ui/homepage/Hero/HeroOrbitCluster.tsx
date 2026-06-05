/**
 * HeroOrbitCluster — a "flavor solar-system": ingredient emojis orbit a glowing
 * center on rotating rings (platter), with occasional comet sweeps. Decorative,
 * motion-safe (static under reduced motion).
 */

import { cn } from "@/lib/utils/cn";

interface Ring {
  r: number;
  dur: number;
  reverse: boolean;
  items: string[];
}

const RINGS: Ring[] = [
  { r: 84, dur: 30, reverse: false, items: ["🧅", "🌶️", "🥬", "🧄"] },
  { r: 148, dur: 48, reverse: true, items: ["🍜", "🥟", "🍛", "🫚", "🍵"] },
];

const COMETS = [
  { emoji: "🌶️", dur: 9, delay: 0 },
  { emoji: "✨", dur: 13, delay: 4.5 },
];

export function HeroOrbitCluster({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
        className
      )}
    >
      {/* Glowing center */}
      <span className="hero-halo-breathe absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-hero-clay/15 blur-xl" />
      <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-hero-clay/70 blur-sm" />

      {/* Orbit rings */}
      {RINGS.map((ring, ri) => (
        <div
          key={ri}
          className="absolute left-1/2 top-1/2 motion-safe:animate-spin"
          style={{
            width: ring.r * 2,
            height: ring.r * 2,
            marginLeft: -ring.r,
            marginTop: -ring.r,
            animationDuration: `${ring.dur}s`,
            animationDirection: ring.reverse ? "reverse" : "normal",
          }}
        >
          <span className="absolute inset-0 rounded-full border border-hero-line" />
          {ring.items.map((em, i) => {
            const angle = (i / ring.items.length) * 360;
            return (
              <span
                key={i}
                className="absolute left-1/2 top-1/2"
                style={{ transform: `rotate(${angle}deg) translateY(${-ring.r}px)` }}
              >
                <span className="block -translate-x-1/2 -translate-y-1/2 text-2xl drop-shadow md:text-3xl">
                  {em}
                </span>
              </span>
            );
          })}
        </div>
      ))}

      {/* Comet sweeps */}
      {COMETS.map((c, i) => (
        <span
          key={i}
          className="hero-comet absolute left-1/2 top-1/2 text-xl md:text-2xl"
          style={{ animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s` }}
        >
          {c.emoji}
        </span>
      ))}
    </div>
  );
}
