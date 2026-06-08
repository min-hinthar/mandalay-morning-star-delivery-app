import Image from "next/image";

import { MenuTextureBackdrop } from "@/components/ui/menu/MenuTextureBackdrop";

const PHOTO = "/images/menu-section-bg.webp";

/**
 * Checkout backdrop — melds the menu-section photo INTO the "After Dark" sunset
 * canvas so the menu → checkout journey reads as one room without losing the
 * checkout's identity. Layered bottom→top:
 *   1. the `.checkout-canvas` sunset gradient (the host element's own background)
 *   2. the menu photo, soft-light-blended at low opacity → it tints/textures the
 *      sunset instead of covering it (the meld)
 *   3. a gentle theme-aware cream wash so masthead/stepper text stays legible
 *   4. the editorial dot/line-grid + triad-glow texture (`MenuTextureBackdrop`)
 *
 * The photo is full-bleed on `md+`, but on mobile a full-bleed `object-cover`
 * over the very tall checkout column crops a landscape photo into a heavy zoom —
 * so mobile gets a bounded TOP BAND that dissolves into the sunset below (mask
 * fade), keeping the photo present without the zoom.
 *
 * Decorative + a11y-inert. Mobile-GPU-safe: `<Image>` + opaque-ish overlay +
 * radial-gradient glows only — no `blur()` / `backdrop-filter` (iOS budget).
 */
export function CheckoutBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Desktop: full-bleed photo melded into the sunset */}
      <Image
        src={PHOTO}
        alt=""
        fill
        sizes="100vw"
        quality={85}
        className="hidden object-cover object-center opacity-50 mix-blend-soft-light md:block"
      />

      {/* Mobile: bounded top band, dissolving into the sunset (avoids the tall-
          viewport zoom of a full-bleed cover) */}
      <div
        className="absolute inset-x-0 top-0 h-[44vh] md:hidden"
        style={{
          WebkitMaskImage: "linear-gradient(to bottom, #000 52%, transparent)",
          maskImage: "linear-gradient(to bottom, #000 52%, transparent)",
        }}
      >
        <Image
          src={PHOTO}
          alt=""
          fill
          sizes="100vw"
          quality={85}
          className="object-cover object-center opacity-50 mix-blend-soft-light"
        />
      </div>

      {/* Gentle cream wash (theme-aware) — keeps text legible, cards popping */}
      <div className="absolute inset-0 bg-surface-primary/30" />
      <MenuTextureBackdrop />
    </div>
  );
}

export default CheckoutBackdrop;
