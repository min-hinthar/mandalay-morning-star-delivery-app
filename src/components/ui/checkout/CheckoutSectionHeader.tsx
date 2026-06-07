"use client";

/**
 * CheckoutSectionHeader — editorial ledger header for each step body.
 *
 * Mirrors the masthead pattern at section scale: a bilingual kicker (icon +
 * tracked EN · MY) → hairline rule → Fraunces title with a clay accent word.
 * Lives inside the `.checkout-paper` step card, so it uses the fixed warm
 * hero tokens (ink / clay / cream) and reads in both themes.
 */

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface CheckoutSectionHeaderProps {
  icon: LucideIcon;
  /** Tracked uppercase eyebrow (English). */
  eyebrow: string;
  /** Bilingual Burmese eyebrow counterpart. */
  eyebrowMy: string;
  /** Ink lead words before the accent word. */
  lead: string;
  /** Clay italic accent word. */
  accent: string;
  /** Supporting subhead. */
  sub: string;
  className?: string;
}

export function CheckoutSectionHeader({
  icon: Icon,
  eyebrow,
  eyebrowMy,
  lead,
  accent,
  sub,
  className,
}: CheckoutSectionHeaderProps) {
  return (
    <header className={cn(className)}>
      <div className="flex items-center gap-2 text-hero-accent">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span className="font-body text-2xs font-bold uppercase tracking-[0.18em]">{eyebrow}</span>
        <span aria-hidden="true" className="text-hero-line">
          ·
        </span>
        <span className="font-burmese text-2xs font-semibold tracking-wide" lang="my">
          {eyebrowMy}
        </span>
      </div>

      <div className="mt-2 h-px w-full bg-hero-line" />

      <h2 className="mt-2 font-display text-xl font-semibold tracking-tight text-hero-ink">
        {lead} <span className="italic text-hero-accent">{accent}</span>
      </h2>
      <p className="mt-0.5 font-body text-sm text-hero-ink-muted">{sub}</p>
    </header>
  );
}

export default CheckoutSectionHeader;
