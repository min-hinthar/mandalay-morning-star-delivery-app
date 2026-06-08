"use client";

import { Sparkles } from "lucide-react";

/**
 * MenuHeader — the editorial MASTHEAD. Pure intro that scrolls away (NOT
 * sticky): a sunburst kicker + bilingual Fraunces title + a one-line subhead.
 * Search, filters, cart and the category tabs all live in the pinned <MenuRail>
 * (and the global AppHeader owns cart + ⌘K search), so the masthead stays clean.
 */
export function MenuHeader() {
  return (
    <header className="mx-auto max-w-5xl px-4 pt-5 sm:pt-7">
      {/* Sunburst kicker */}
      <div className="flex items-center gap-2 text-hero-clay">
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        <span className="text-2xs font-semibold uppercase tracking-[0.2em]">Our Menu · မီနူး</span>
      </div>

      {/* Editorial title */}
      <h1 className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display text-3xl font-bold leading-[0.95] text-text-primary sm:text-4xl">
          Authentic Burmese,
        </span>
        <span className="font-display text-3xl font-semibold italic leading-[0.95] text-hero-clay sm:text-4xl">
          made to order
        </span>
      </h1>

      <p className="mt-2 max-w-xl font-body text-sm text-text-secondary">
        Handcrafted from traditional recipes, prepared fresh for weekly delivery.
        <span className="mt-0.5 block font-burmese text-sm text-text-muted">
          အိမ်ချက်ရိုးရာ အရသာအတိုင်း တစ်ပွဲချင်း ဂရုတစိုက် ချက်ပြုတ်ပေးပါတယ်
        </span>
      </p>
    </header>
  );
}
