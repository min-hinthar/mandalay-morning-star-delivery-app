"use client";

/**
 * CheckoutMasthead — editorial "After Dark" header for the checkout ritual.
 *
 * Signature masthead pattern (per hero-design-language §3):
 *   kicker (sunburst + tracked uppercase EN · MY) → hairline rule →
 *   Fraunces headline in ink with a clay italic accent word → bilingual subhead.
 *
 * Step-aware: the accent word + subhead shift with the current step so the
 * header narrates progress ("Where" → "When" → "Almost yours").
 */

import { HeroSunburst } from "@/components/ui/homepage/Hero/HeroSunburst";
import type { CheckoutStep } from "@/types/checkout";

interface MastheadCopy {
  /** Lead-in words rendered in ink before the accent word. */
  lead: string;
  /** Clay italic accent word. */
  accent: string;
  /** Bilingual Burmese subhead. */
  my: string;
}

const STEP_COPY: Record<CheckoutStep, MastheadCopy> = {
  address: { lead: "Where it’s", accent: "headed", my: "ဘယ်ကိုပို့ရမလဲ" },
  time: { lead: "When it", accent: "arrives", my: "ဘယ်အချိန်ရောက်မလဲ" },
  payment: { lead: "Almost", accent: "yours", my: "သင့်အော်ဒါ အတည်ပြုပါ" },
};

interface CheckoutMastheadProps {
  step: CheckoutStep;
  className?: string;
}

export function CheckoutMasthead({ step, className }: CheckoutMastheadProps) {
  const copy = STEP_COPY[step];

  return (
    <header className={className}>
      {/* Kicker — sunburst + tracked label, bilingual */}
      <div className="checkout-accent flex items-center gap-2.5">
        <HeroSunburst className="h-4 w-4" rays={8} />
        <span className="font-body text-2xs font-bold uppercase tracking-[0.22em]">Checkout</span>
        <span aria-hidden="true" className="checkout-ink-muted opacity-50">
          ·
        </span>
        <span className="font-burmese text-2xs font-semibold tracking-wide" lang="my">
          ငွေပေးချေမှု
        </span>
      </div>

      {/* Hairline rule */}
      <div className="checkout-hairline mt-3 h-px w-full" />

      {/* Headline — Fraunces, ink, clay italic accent */}
      <h1 className="checkout-ink mt-3 font-display text-3xl font-semibold leading-[1.05] tracking-tight sm:text-4xl">
        {copy.lead} <span className="checkout-accent italic">{copy.accent}</span>
        <span className="checkout-accent">.</span>
      </h1>

      {/* Bilingual subhead */}
      <p className="checkout-ink-muted mt-1.5 font-burmese text-sm" lang="my">
        {copy.my}
      </p>
    </header>
  );
}

export default CheckoutMasthead;
