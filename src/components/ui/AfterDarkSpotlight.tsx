"use client";

/**
 * AfterDarkSpotlight — the hero's desktop cursor spotlight, extracted for the
 * level-up kit: a soft warm light that follows the pointer, revealing the
 * ambient dot-grid/texture beneath it (`mix-blend-screen`).
 *
 * Drop inside any `relative` After-Dark canvas, above `AfterDarkAmbient` and
 * below the `z-10` content. Pointer devices only — gated by the device-tier
 * FX budget (`useHeroFx().spotlight`, desktop tier), so it costs nothing on
 * mobile. `useHeroParallax` is rAF-throttled and detaches its listeners when
 * the host scrolls offscreen. Decorative + a11y-inert; reduced-motion no-ops
 * via the parallax hook.
 */

import { useRef } from "react";
import { m, useTransform } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { useHeroParallax } from "@/components/ui/homepage/Hero/interactions";
import { useHeroFx } from "@/lib/hooks/useHeroFx";

export function AfterDarkSpotlight({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const fx = useHeroFx();
  const { x, y } = useHeroParallax(ref);
  const spotX = useTransform(x, (v) => `${(0.5 + v) * 100}%`);
  const spotY = useTransform(y, (v) => `${(0.5 + v) * 100}%`);

  if (!fx.spotlight) return null;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <m.div
        className="absolute h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen"
        style={{
          left: spotX,
          top: spotY,
          background:
            "radial-gradient(circle, rgba(255,247,237,0.26), rgba(217,119,87,0.10) 38%, transparent 68%)",
        }}
      />
    </div>
  );
}

export default AfterDarkSpotlight;
