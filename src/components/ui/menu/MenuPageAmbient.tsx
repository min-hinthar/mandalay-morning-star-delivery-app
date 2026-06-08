import { PhotoBandBackdrop } from "@/components/ui/PhotoBandBackdrop";

/**
 * MenuPageAmbient — full-viewport menu-page backdrop using the shared zoomed-out
 * photo band (`PhotoBandBackdrop`): the warm food photo as a bounded, masked top
 * band (less crop than a full-bleed cover) soft-light-melded into the surface,
 * under a cream wash + the editorial dot/line-grid + triad-glow texture.
 *
 * Viewport-`fixed` behind the content (`-z-10`) so it stays a pinned, loosely-
 * framed backdrop. The menu `<main>` is transparent + non-isolating, so this
 * sits behind ALL page content incl. the trailing site footer. Decorative +
 * a11y-inert; mobile-GPU-safe (see `PhotoBandBackdrop`).
 */
export function MenuPageAmbient() {
  return <PhotoBandBackdrop className="fixed inset-0 -z-10" />;
}

export default MenuPageAmbient;
