import Image from "next/image";

import { cn } from "@/lib/utils/cn";
import { MenuTextureBackdrop } from "@/components/ui/menu/MenuTextureBackdrop";

const PHOTO = "/images/menu-section-bg.webp";

interface PhotoBandBackdropProps {
  /**
   * Position + extra classes for the root. The caller decides how the backdrop
   * is anchored, e.g. `"absolute inset-0"` (spans its host) or
   * `"fixed inset-0 -z-10"` (viewport-pinned behind page content).
   */
  className?: string;
  /** Theme-aware cream wash over the photo for legibility (Tailwind class). */
  washClassName?: string;
}

/**
 * Shared "zoomed-out photo band" backdrop — the warm menu photo
 * (`menu-section-bg.webp`) as a bounded, masked TOP BAND (far less crop than a
 * full-bleed `object-cover` over a tall column), soft-light-blended at low
 * opacity so it MELDS into the surface beneath rather than covering it, then a
 * theme-aware cream wash + the editorial dot/line-grid + triad-glow texture
 * (`MenuTextureBackdrop`).
 *
 * One treatment shared by checkout, the menu page, and the homepage menu section
 * so the photo reads consistently zoomed-out everywhere. Decorative + a11y-inert.
 * Mobile-GPU-safe: `<Image>` + opaque-ish overlay + radial-gradient glows only —
 * no `blur()` / `backdrop-filter` (iOS budget); the texture's heavier line-grid +
 * grain are gated `md+`.
 */
export function PhotoBandBackdrop({
  className,
  washClassName = "bg-surface-primary/30",
}: PhotoBandBackdropProps) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none overflow-hidden", className)}>
      {/* Zoomed-out photo band, dissolving gently into the surface near its foot */}
      <div
        className="absolute inset-x-0 top-0 h-[46vh] md:h-[72vh]"
        style={{
          WebkitMaskImage: "linear-gradient(to bottom, #000 72%, transparent)",
          maskImage: "linear-gradient(to bottom, #000 72%, transparent)",
        }}
      >
        <Image
          src={PHOTO}
          alt=""
          fill
          sizes="100vw"
          quality={85}
          className="object-cover object-center opacity-[0.62] mix-blend-soft-light"
        />
      </div>

      {/* Gentle cream wash (theme-aware) — keeps text legible, cards popping */}
      <div className={cn("absolute inset-0", washClassName)} />
      <MenuTextureBackdrop />
    </div>
  );
}

export default PhotoBandBackdrop;
