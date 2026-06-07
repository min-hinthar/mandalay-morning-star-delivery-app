import type { CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * MenuTextureBackdrop — layered editorial texture for a menu section.
 *
 * Stacks gradient-masked dot-grid + line-grid + soft triad glow blooms behind
 * the menu content. Drop into a `relative`/`isolate` section, above the
 * background overlay but below the `z-10` content.
 *
 * Decorative + a11y-inert. Grid colors flip with the theme (`--menu-texture-*`)
 * so they read on the light *and* dark section overlay. Mobile-GPU-safe: pure
 * `background-image` grids (no filters) + `radial-gradient` glows (no `blur()`/
 * `backdrop-filter`); the heavier line-grid + grain are gated to `md+`. Static
 * (no JS loops) so it's reduced-motion-safe by construction.
 */
export function MenuTextureBackdrop({ className }: { className?: string }) {
  // Radial mask so the grids fade out toward the edges (never a uniform field).
  const dotMask = "radial-gradient(125% 95% at 50% 0%, #000 28%, transparent 80%)";
  const lineMask = "radial-gradient(110% 80% at 50% 100%, #000 22%, transparent 82%)";

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {/* Dot-grid — primary texture */}
      <span
        className="hero-dotgrid absolute inset-0 opacity-[0.55]"
        style={
          {
            "--dot-color": "var(--menu-texture-dot)",
            "--dot-gap": "22px",
            "--dot-r": "1px",
            WebkitMaskImage: dotMask,
            maskImage: dotMask,
          } as CSSProperties
        }
      />

      {/* Line-grid — fainter cross-hatch, desktop only */}
      <span
        className="hero-linegrid absolute inset-0 hidden opacity-[0.4] md:block"
        style={
          {
            "--line-color": "var(--menu-texture-line)",
            "--line-gap": "44px",
            WebkitMaskImage: lineMask,
            maskImage: lineMask,
          } as CSSProperties
        }
      />

      {/* Paper grain — desktop only, very subtle */}
      <span className="hero-paper-grain absolute inset-0 hidden opacity-[0.04] md:block" />

      {/* Triad glow blooms — radial-gradient falloff (no blur) keeps mobile safe */}
      <span
        className="absolute -left-24 top-8 h-72 w-72 rounded-full opacity-[0.35]"
        style={{ background: "radial-gradient(circle, var(--menu-clay), transparent 68%)" }}
      />
      <span
        className="absolute -right-20 top-1/3 h-80 w-80 rounded-full opacity-[0.28]"
        style={{ background: "radial-gradient(circle, var(--menu-gold), transparent 70%)" }}
      />
      <span
        className="absolute left-1/3 bottom-0 hidden h-72 w-72 rounded-full opacity-[0.22] md:block"
        style={{ background: "radial-gradient(circle, var(--hero-blue), transparent 72%)" }}
      />
    </div>
  );
}

export default MenuTextureBackdrop;
