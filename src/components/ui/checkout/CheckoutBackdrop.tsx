import Image from "next/image";

import { MenuTextureBackdrop } from "@/components/ui/menu/MenuTextureBackdrop";

/**
 * Checkout backdrop — the menu-section treatment ported to checkout so the
 * menu → checkout journey reads as one room: `menu-section-bg.webp` full-bleed
 * under an 85% cream overlay (theme-aware via `surface-primary`, so the cream
 * cards still pop in light *and* dark), topped with the editorial dot/line-grid
 * + triad-glow texture (`MenuTextureBackdrop`).
 *
 * Decorative + a11y-inert. Mobile-GPU-safe: an `<Image>` + an opaque overlay +
 * radial-gradient glows only — no `blur()` / `backdrop-filter` (iOS budget). The
 * heavier line-grid + grain inside the texture are already gated to `md+`.
 */
export function CheckoutBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <Image
        src="/images/menu-section-bg.webp"
        alt=""
        fill
        sizes="100vw"
        quality={85}
        className="object-cover object-center"
      />
      {/* Cream readability overlay (theme-aware) — keeps the cards popping. */}
      <div className="absolute inset-0 bg-surface-primary/85" />
      <MenuTextureBackdrop />
    </div>
  );
}

export default CheckoutBackdrop;
