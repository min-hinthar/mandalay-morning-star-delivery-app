import Image from "next/image";

import { MenuTextureBackdrop } from "@/components/ui/menu/MenuTextureBackdrop";

const PHOTO = "/images/menu-section-bg.webp";

/**
 * Checkout backdrop — melds the menu-section photo INTO the "After Dark" sunset
 * canvas so the menu → checkout journey reads as one room without losing the
 * checkout's identity. Layered bottom→top:
 *   1. the `.checkout-canvas` sunset gradient (the host element's own background)
 *   2. the menu photo as a TOP BAND that dissolves into the sunset (mask fade),
 *      soft-light-blended at low opacity → it tints/textures the sunset instead
 *      of covering it (the meld). A bounded band (vs. a full-bleed `object-cover`
 *      over the very tall checkout column) keeps the landscape photo "zoomed
 *      out" — far less crop — on every viewport; the band is taller on `md+`.
 *   3. a gentle theme-aware cream wash so masthead/stepper text stays legible
 *   4. the editorial dot/line-grid + triad-glow texture (`MenuTextureBackdrop`)
 *
 * Decorative + a11y-inert. Mobile-GPU-safe: `<Image>` + opaque-ish overlay +
 * radial-gradient glows only — no `blur()` / `backdrop-filter` (iOS budget).
 */
export function CheckoutBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Zoomed-out photo band, dissolving gently into the sunset near its foot.
          Taller on md+ → less crop; the fade only starts at ~72% so the photo
          stays present (less dissolve) before handing off to the sunset. */}
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
      <div className="absolute inset-0 bg-surface-primary/30" />
      <MenuTextureBackdrop />
    </div>
  );
}

export default CheckoutBackdrop;
