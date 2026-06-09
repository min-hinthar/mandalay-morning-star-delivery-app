import type { ReactNode } from "react";
import { AfterDarkAmbient } from "@/components/ui/AfterDarkAmbient";
import { AuthBrandPanel } from "./AuthBrandPanel";

/**
 * AuthBackground — the After Dark auth shell (editorial split).
 *
 * Desktop (`lg:`): a two-column editorial split — the `AuthBrandPanel` brand
 * half on the left, the form card on the right — both floating over the shared
 * `.after-dark-canvas` + `AfterDarkAmbient` living texture. Mobile/tablet:
 * a single centered/bottom-anchored column (the card carries its own compact
 * masthead). iOS-GPU-safe: the ambient is radial-gradient glows + masked grids,
 * no `blur()`/`backdrop-filter`.
 */
interface AuthBackgroundProps {
  children: ReactNode;
}

export function AuthBackground({ children }: AuthBackgroundProps) {
  return (
    <div className="after-dark-canvas relative min-h-screen w-full overflow-hidden">
      {/* Living texture — dot/line grids + triad aurora (a11y-inert, blur-free) */}
      <AfterDarkAmbient />

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
