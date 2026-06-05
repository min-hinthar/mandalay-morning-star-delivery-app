"use client";

/**
 * useHeroFx — device-tiered hero effects budget + survival telemetry.
 *
 * WHY: the maximalist hero OOM-crashed iOS WebKit (stacked full-screen blur() +
 * backdrop-filter). iOS exposes no memory API and an OOM kills JS before Sentry
 * can report — so we can't read a crash "limit". Instead we (a) gate expensive
 * effects behind a per-device budget and (b) emit a survival beacon so we can
 * MEASURE the safe budget empirically, then ratchet creativity up with certainty.
 *
 * Default mobile = `baseline` (crash-safe). Desktop = `rich`. Force a profile to
 * test on a real device with `?fx=rich|lite|baseline`. See
 * docs/hero-design-language.md §7.1.
 */

import { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";

export type FxProfile = "rich" | "lite" | "baseline";
export type DeviceTier = "desktop" | "high" | "mid" | "low";

export interface HeroFxBudget {
  profile: FxProfile;
  /** Render the morphing mesh orbs */
  orbs: boolean;
  /** Apply the (expensive) blur() to the orbs vs. rely on the gradient falloff */
  orbBlur: boolean;
  /** Render the aurora ribbons (full-screen blur — desktop only) */
  auroras: boolean;
  /** Render the cursor spotlight (pointer only) */
  spotlight: boolean;
  /** Float emojis in FRONT of the cards (visible on mobile) vs behind */
  frontEmojis: boolean;
  /** Emojis are tappable (burst) — only when behind the cards */
  interactiveEmojis: boolean;
  /** How many floating emojis to render */
  emojiCount: number;
}

const BUDGETS: Record<FxProfile, Omit<HeroFxBudget, "profile">> = {
  // Desktop / capable: the full show.
  rich: {
    orbs: true,
    orbBlur: true,
    auroras: true,
    spotlight: true,
    frontEmojis: false,
    interactiveEmojis: true,
    emojiCount: 17,
  },
  // Experimental mobile-rich (no backdrop/full-screen blur): orbs via gradient
  // falloff, emojis in front. Validated per-device via telemetry before we
  // promote any tier to it.
  lite: {
    orbs: true,
    orbBlur: false,
    auroras: false,
    spotlight: false,
    frontEmojis: true,
    interactiveEmojis: false,
    emojiCount: 12,
  },
  // Crash-safe floor for mobile.
  baseline: {
    orbs: false,
    orbBlur: false,
    auroras: false,
    spotlight: false,
    frontEmojis: false,
    interactiveEmojis: false,
    emojiCount: 7,
  },
};

function readOverride(): FxProfile | null {
  if (typeof window === "undefined") return null;
  const p = new URLSearchParams(window.location.search).get("fx");
  return p === "rich" || p === "lite" || p === "baseline" ? p : null;
}

function deviceTier(): DeviceTier {
  if (typeof window === "undefined" || !window.matchMedia) return "low";
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) return "desktop";
  const cores = navigator.hardwareConcurrency ?? 0;
  if (cores >= 8) return "high";
  if (cores >= 6) return "mid";
  return "low";
}

/** Default profile by tier — mobile stays `baseline` until telemetry proves a
 *  higher budget is safe. Promote here once the survival data supports it. */
function profileForTier(tier: DeviceTier): FxProfile {
  if (tier === "desktop") return "rich";
  // Honor explicit calm requests.
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return "baseline";
  return "baseline";
}

const BEACON_SAMPLE_RATE = 0.25;

export function useHeroFx(): HeroFxBudget {
  // Start at the crash-safe baseline (also the SSR value) — never render the
  // rich set on first paint where it could crash before detection runs.
  const [profile, setProfile] = useState<FxProfile>("baseline");

  useEffect(() => {
    const tier = deviceTier();
    const next = readOverride() ?? profileForTier(tier);
    setProfile(next);
    document.documentElement.dataset.fx = next;

    // Survival telemetry — only on touch devices (where crashes happen),
    // sampled to control event volume. `hero_render` without a matching
    // `hero_stable` (filter `os:iOS`) ⇒ the tab crashed under that profile.
    if (tier === "desktop" || Math.random() > BEACON_SAMPLE_RATE) return;
    const tags = {
      fx_profile: next,
      device_tier: tier,
      dpr: String(Math.round(window.devicePixelRatio || 1)),
      cores: String(navigator.hardwareConcurrency ?? 0),
    };
    Sentry.captureMessage("hero_render", {
      level: "info",
      tags,
      fingerprint: ["hero-fx", "render", next],
    });
    const t = window.setTimeout(() => {
      Sentry.captureMessage("hero_stable", {
        level: "info",
        tags,
        fingerprint: ["hero-fx", "stable", next],
      });
    }, 4000);
    return () => window.clearTimeout(t);
  }, []);

  return { profile, ...BUDGETS[profile] };
}
