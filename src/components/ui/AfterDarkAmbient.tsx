import type { CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * AfterDarkAmbient — the canonical living-texture backdrop for After Dark surfaces
 * (the level-up kit's shared ambient; generalizes MenuTextureBackdrop).
 *
 * Layered, gradient-masked dot + line grids + paper grain + soft triad "aurora"
 * blooms behind the content. Pair with the `.after-dark-canvas` gradient base (or
 * any warm surface): drop into a `relative`/`isolate` container, above the surface
 * background and below the `z-10` content.
 *
 * Decorative + a11y-inert. Mobile-GPU-safe: pure `background-image` grids (no
 * filters) + `radial-gradient` glows (no `blur()`/`backdrop-filter`); the heavier
 * line-grid + grain + the cool blooms gate to `md:`. Static (no JS loops) →
 * reduced-motion-safe by construction. Grid colors flip with the theme via
 * `--menu-texture-*`, so the texture reads on the light *and* dark canvas.
 */
export function AfterDarkAmbient({ className }: { className?: string }) {
  // Radial masks so the grids fade out toward the edges (never a uniform field).
  const dotMask = "radial-gradient(125% 95% at 50% 0%, #000 28%, transparent 80%)";
  const lineMask = "radial-gradient(110% 80% at 50% 100%, #000 22%, transparent 82%)";

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {/* Dot-grid — primary texture */}
      <span
        className="hero-dotgrid absolute inset-0 opacity-[0.5]"
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
        className="hero-linegrid absolute inset-0 hidden opacity-[0.38] md:block"
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

      {/* Triad aurora ribbons — radial-gradient falloff (no blur) keeps mobile safe.
          Warm pair always on; cool pair gates to md+ to cap the mobile layer count. */}
      <span
        className="absolute -left-24 -top-10 h-72 w-96 rounded-full opacity-[0.3]"
        style={{
          background: "radial-gradient(60% 60% at 50% 50%, var(--menu-clay), transparent 70%)",
        }}
      />
      <span
        className="absolute -right-24 top-1/4 h-72 w-96 rounded-full opacity-[0.24]"
        style={{
          background: "radial-gradient(60% 60% at 50% 50%, var(--menu-gold), transparent 72%)",
        }}
      />
      <span
        className="absolute -bottom-24 left-1/4 hidden h-72 w-96 rounded-full opacity-[0.2] md:block"
        style={{
          background: "radial-gradient(60% 60% at 50% 50%, var(--hero-blue), transparent 74%)",
        }}
      />
      <span
        className="absolute bottom-0 right-1/4 hidden h-72 w-72 rounded-full opacity-[0.18] md:block"
        style={{ background: "radial-gradient(circle, var(--hero-sage), transparent 72%)" }}
      />
    </div>
  );
}

export default AfterDarkAmbient;
