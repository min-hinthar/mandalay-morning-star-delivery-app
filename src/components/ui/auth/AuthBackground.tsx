import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { AfterDarkAmbient } from "@/components/ui/AfterDarkAmbient";
import { AuthBrandPanel } from "./AuthBrandPanel";

const PHOTO = "/images/menu-section-bg.webp";

/**
 * AuthBackground — the After Dark auth shell (editorial split).
 *
 * Desktop (`lg:`): a two-column editorial split — the `AuthBrandPanel` (the
 * appetizing menu photo + bilingual wordmark) on the left, the form card on the
 * right — over the shared `.after-dark-canvas` + `AfterDarkAmbient` texture.
 * Mobile/tablet: a masked menu-photo band at the top (the "hunger" cue) with the
 * form card below it. iOS-GPU-safe: `<Image>` + gradient masks/scrims + the
 * ambient's radial glows — no `blur()`/`backdrop-filter`.
 */
interface AuthBackgroundProps {
  children: ReactNode;
}

export function AuthBackground({ children }: AuthBackgroundProps) {
  return (
    <div className="after-dark-canvas relative min-h-screen w-full overflow-hidden">
      {/* Living texture — dot/line grids + triad aurora (a11y-inert, blur-free) */}
      <AfterDarkAmbient />

      {/* Mobile/tablet appetizing photo band — above the card, dissolves into canvas */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[42vh] overflow-hidden lg:hidden"
        style={
          {
            WebkitMaskImage: "linear-gradient(to bottom, #000 60%, transparent)",
            maskImage: "linear-gradient(to bottom, #000 60%, transparent)",
          } as CSSProperties
        }
      >
        <Image
          src={PHOTO}
          alt=""
          fill
          sizes="100vw"
          quality={85}
          priority
          className="object-cover object-center opacity-90"
        />
        {/* Warm wash so the photo melds into the canvas tone */}
        <div className="absolute inset-0 bg-gradient-to-b from-hero-ink/25 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col lg:flex-row lg:items-stretch">
        {/* Brand half — desktop only */}
        <AuthBrandPanel className="lg:w-1/2" />

        {/* Form half — bottom-sheet on mobile, centered on sm+, right column on lg */}
        <div className="flex min-h-screen flex-1 items-end justify-center px-0 py-6 sm:items-center sm:p-4 lg:min-h-0 lg:py-12">
          {children}
        </div>
      </div>
    </div>
  );
}
