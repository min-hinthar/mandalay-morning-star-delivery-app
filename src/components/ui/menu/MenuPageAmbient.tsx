import Image from "next/image";
import { MenuTextureBackdrop } from "./MenuTextureBackdrop";

/**
 * MenuPageAmbient — full-viewport menu-page backdrop, reusing the homepage menu
 * section's treatment: the warm food photo → an 85% surface overlay for
 * readability → the layered editorial texture (`MenuTextureBackdrop`:
 * gradient-masked dot/line grids + triad glow blooms).
 *
 * Scoped to the menu `<main>` (absolute, behind the content via `-z-10`), so it
 * covers the page surface but NOT the site footer that follows `<main>` — a
 * viewport-`fixed` layer would paint over the footer (main is an isolated
 * stacking context). Decorative + a11y-inert.
 *
 * Mobile-GPU budget: a single decoded image + radial-gradient glows + cheap
 * masked grids — NO `blur()` / `backdrop-filter` (the iOS-OOM class). The
 * heavier line-grid + grain inside `MenuTextureBackdrop` are already gated md:+.
 */
export function MenuPageAmbient() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Warm food photo — shared with the homepage menu section. */}
      <Image
        src="/images/menu-section-bg.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center"
        quality={85}
        priority={false}
      />

      {/* Surface overlay for legibility (matches the homepage section). */}
      <div className="absolute inset-0 bg-surface-primary/85" />

      {/* Layered editorial texture — masked dot/line grids + triad glow blooms. */}
      <MenuTextureBackdrop />
    </div>
  );
}

export default MenuPageAmbient;
