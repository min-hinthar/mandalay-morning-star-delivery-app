import Image from "next/image";

import { MenuTextureBackdrop } from "@/components/ui/menu/MenuTextureBackdrop";

/**
 * Checkout backdrop — melds the menu-section photo INTO the "After Dark" sunset
 * canvas so the menu → checkout journey reads as one room without losing the
 * checkout's identity. Layered bottom→top:
 *   1. the `.checkout-canvas` sunset gradient (the host element's own background)
 *   2. `menu-section-bg.webp`, soft-light-blended at low opacity → the photo
 *      tints/textures the sunset instead of covering it (the meld)
 *   3. a gentle theme-aware cream wash so the masthead/stepper text stays legible
 *   4. the editorial dot/line-grid + triad-glow texture (`MenuTextureBackdrop`)
 *
 * Decorative + a11y-inert. Mobile-GPU-safe: an `<Image>`, an opaque-ish overlay,
 * and radial-gradient glows only — no `blur()` / `backdrop-filter` (iOS budget);
 * the texture's heavier line-grid + grain are gated to `md+`.
 */
export function CheckoutBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Photo melded into the sunset gradient via soft-light blend */}
      <Image
        src="/images/menu-section-bg.webp"
        alt=""
        fill
        sizes="100vw"
        quality={85}
        className="object-cover object-center opacity-50 mix-blend-soft-light"
      />
      {/* Gentle cream wash (theme-aware) — keeps text legible, cards popping */}
      <div className="absolute inset-0 bg-surface-primary/30" />
      <MenuTextureBackdrop />
    </div>
  );
}

export default CheckoutBackdrop;
