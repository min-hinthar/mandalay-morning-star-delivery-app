import type { CSSProperties } from "react";

/**
 * MenuPageAmbient — full-viewport Anthropic "warm paper floating on sunset"
 * atmosphere for the menu page, mirroring the homepage hero's maximalist layered
 * depth. Fixed behind the scrolling content (`-z-10`). Layer stack (back→front):
 *
 *   magenta sunset sky  (on `.menu-page-bg`, the <main>)
 *     → drifting triad orb blooms (clay / blue / sage / gold)
 *     → dot-grid + line-grid textures
 *     → paper grain
 *     → grounding vignette
 *
 * Decorative + a11y-inert (`aria-hidden`, `pointer-events-none`).
 *
 * Mobile-GPU budget (HARD constraint — stacked blur OOM-crashes iOS WebKit):
 * radial-gradient blooms ONLY (no `blur()` / `backdrop-filter`), a cheap masked
 * dot-grid, and a low floating-element count on phones. The heavier line-grid,
 * paper grain, the extra orbs, and ALL orb drift are gated to `md:+`. Drift is
 * CSS + motion-gated, so it's reduced-motion-safe by construction.
 */
export function MenuPageAmbient() {
  const dotMask = "radial-gradient(130% 90% at 50% 0%, #000 30%, transparent 82%)";
  const lineMask = "radial-gradient(120% 80% at 50% 100%, #000 20%, transparent 84%)";

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Triad orb blooms — radial falloff (no blur). Clay + blue render on all
          viewports (2 cheap gradients); sage + gold are md:+ only. */}
      <span
        className="menu-orb menu-orb-drift-a absolute -left-28 -top-20 h-[28rem] w-[28rem]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--menu-clay) 82%, transparent), transparent 66%)",
        }}
      />
      <span
        className="menu-orb menu-orb-drift-b absolute -right-24 top-20 h-[26rem] w-[26rem]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--hero-blue) 72%, transparent), transparent 68%)",
        }}
      />
      <span
        className="menu-orb menu-orb-drift-c absolute left-1/4 top-[44%] hidden h-[24rem] w-[24rem] md:block"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--hero-sage) 66%, transparent), transparent 70%)",
        }}
      />
      <span
        className="menu-orb absolute right-[28%] bottom-12 hidden h-80 w-80 md:block"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--menu-gold) 58%, transparent), transparent 70%)",
        }}
      />

      {/* Dot-grid — primary texture, all viewports, theme-aware + edge-masked. */}
      <span
        className="hero-dotgrid absolute inset-0 opacity-50"
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

      {/* Line-grid — fainter cross-hatch, desktop only. */}
      <span
        className="hero-linegrid absolute inset-0 hidden opacity-40 md:block"
        style={
          {
            "--line-color": "var(--menu-texture-line)",
            "--line-gap": "46px",
            WebkitMaskImage: lineMask,
            maskImage: lineMask,
          } as CSSProperties
        }
      />

      {/* Paper grain — desktop only, very subtle living texture. */}
      <span className="hero-paper-grain hero-grain-drift absolute inset-0 hidden opacity-[0.05] md:block" />

      {/* Grounding vignette — pulls the sunset down at the edges. */}
      <span className="menu-ambient-vignette absolute inset-0" />
    </div>
  );
}

export default MenuPageAmbient;
