import Image from "next/image";
import { MenuTextureBackdrop } from "./MenuTextureBackdrop";

/**
 * MenuPageAmbient — full-viewport menu-page backdrop, reusing the homepage menu
 * section's treatment: the warm food photo → an 85% surface overlay for
 * readability → the layered editorial texture (`MenuTextureBackdrop`:
 * gradient-masked dot/line grids + triad glow blooms).
 *
 * Viewport-`fixed` behind the content (`-z-10`) so the photo stays a pinned,
 * loosely-framed backdrop (object-cover crops to the viewport, not the full tall
 * page). The menu `<main>` is transparent + non-isolating, so this sits in the
 * root layer behind ALL page content incl. the trailing site footer.
 * Decorative + a11y-inert.
 *
 * Mobile-GPU budget: a single decoded image + radial-gradient glows + cheap
 * masked grids — NO `blur()` / `backdrop-filter` (the iOS-OOM class). The
 * heavier line-grid + grain inside `MenuTextureBackdrop` are already gated md:+.
 */
export function MenuPageAmbient() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
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
