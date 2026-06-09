import type { CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * GoldLeaf — decorative gold-leaf fleck + lacquer-sheen overlay for warm-paper
 * cards (Mandalay identity, level-up kit). Drop inside a `relative` card, above
 * the surface and any `HeroCardLayers`, below the content.
 *
 * Decorative + a11y-inert. Static + mobile-GPU-safe: gold-leaf flecks are a
 * gradient-masked `background-image` (no filters) and the lacquer sheen is a soft
 * low-opacity gold gradient (no `blur()`). Token-pure (`--hero-gold` via
 * `color-mix`). Clips to the host card's `radius`.
 */
export function GoldLeaf({
  className,
  radius = "rounded-2xl",
}: {
  className?: string;
  radius?: string;
}) {
  // Fade the flecks up from the top so they sit under content, never a flat field.
  const fleckMask = "radial-gradient(120% 100% at 50% 0%, #000 32%, transparent 86%)";

  return (
    <span aria-hidden="true" className={cn("pointer-events-none absolute inset-0", className)}>
      {/* Sparse gold-leaf flecks */}
      <span
        className={cn("absolute inset-0 opacity-50", radius)}
        style={
          {
            backgroundImage:
              "radial-gradient(circle, color-mix(in srgb, var(--hero-gold) 65%, transparent) 0.6px, transparent 1.7px)",
            backgroundSize: "19px 23px",
            WebkitMaskImage: fleckMask,
            maskImage: fleckMask,
          } as CSSProperties
        }
      />
      {/* Lacquer sheen — a soft diagonal gold gradient catching the light */}
      <span
        className={cn("absolute inset-0 opacity-[0.12]", radius)}
        style={{
          background:
            "linear-gradient(120deg, transparent 36%, color-mix(in srgb, var(--hero-gold) 55%, transparent) 50%, transparent 64%)",
        }}
      />
    </span>
  );
}

export default GoldLeaf;
