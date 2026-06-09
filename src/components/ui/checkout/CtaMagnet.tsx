"use client";

/**
 * CtaMagnet — checkout CTA wrapper. Thin alias over the shared `MagneticButton`
 * (magnetic pull + tap ripple, reduced-motion-safe) so the checkout footers keep
 * their exact feel while the primitive is shared across surfaces.
 */

import type { ReactNode } from "react";
import { MagneticButton } from "@/components/ui/MagneticButton";

export function CtaMagnet({ children, className }: { children: ReactNode; className?: string }) {
  return <MagneticButton className={className}>{children}</MagneticButton>;
}

export default CtaMagnet;
