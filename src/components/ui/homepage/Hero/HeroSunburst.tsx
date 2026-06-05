/**
 * HeroSunburst — decorative Anthropic-style radiating mark.
 * Rays draw-on once on load (motion-gated; fully drawn under reduced motion).
 */

import { cn } from "@/lib/utils/cn";

interface HeroSunburstProps {
  className?: string;
  /** Number of rays (alternating long/short) */
  rays?: number;
}

export function HeroSunburst({ className, rays = 8 }: HeroSunburstProps) {
  const cx = 12;
  const cy = 12;
  const inner = 3.5;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      aria-hidden="true"
      className={cn("h-5 w-5", className)}
    >
      {Array.from({ length: rays }).map((_, i) => {
        const angle = (i / rays) * Math.PI * 2 - Math.PI / 2;
        const outer = i % 2 === 0 ? 10.5 : 7.5;
        const x1 = cx + Math.cos(angle) * inner;
        const y1 = cy + Math.sin(angle) * inner;
        const x2 = cx + Math.cos(angle) * outer;
        const y2 = cy + Math.sin(angle) * outer;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            pathLength={1}
            className="animate-hero-draw"
            style={{ animationDelay: `${0.2 + i * 0.05}s` }}
          />
        );
      })}
    </svg>
  );
}
