"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { Gift, X, ArrowRight, ChevronRight, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

const COLLAPSE_KEY = "mms_offer_banner_collapsed";
// Legacy permanent-dismiss flag — returning users who dismissed before now see
// the collapsed pill (still reachable), not the full banner again.
const LEGACY_DISMISS_KEY = "mms_offer_banner_dismissed";

interface OfferBannerProps {
  className?: string;
  /** Attribution tag appended to the share link. */
  source?: string;
}

/**
 * Warm-paper awareness strip for the welcome + referral offers, on high-intent
 * surfaces (homepage, menu, checkout). "Dismiss" COLLAPSES it to a small,
 * re-expandable rewards pill rather than hiding it forever — so the offer
 * persists without nagging. Renders nothing until the flag is read (no flash).
 */
export function OfferBanner({ className, source = "banner" }: OfferBannerProps) {
  const { shouldAnimate } = useAnimationPreference();
  const [ready, setReady] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(COLLAPSE_KEY) === "1") setCollapsed(true);
      else if (localStorage.getItem(LEGACY_DISMISS_KEY) === "1") setCollapsed(true);
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  const persist = (next: boolean) => {
    try {
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
    } catch {
      // ignore
    }
  };
  const collapse = () => {
    setCollapsed(true);
    persist(true);
  };
  const expand = () => {
    setCollapsed(false);
    persist(false);
  };

  if (!ready) return null;

  return (
    <div className={cn("relative", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {collapsed ? (
          <m.button
            key="pill"
            type="button"
            onClick={expand}
            aria-label="Show rewards offer — $5 off your first order, and refer a friend for $10"
            initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
            animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
            exit={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className={cn(
              "group inline-flex items-center gap-2.5 rounded-full hero-surface-paper py-1.5 pl-1.5 pr-4",
              "shadow-sm ring-1 ring-hero-line transition-all duration-300",
              "hover:-translate-y-0.5 hover:shadow-md",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-clay/50"
            )}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-hero-clay/15 text-hero-clay ring-1 ring-hero-clay/20">
              <Gift className="h-[18px] w-[18px]" />
            </span>
            <span className="flex flex-col items-start leading-tight">
              <span className="text-sm font-bold text-hero-ink">Rewards</span>
              <span className="text-2xs font-medium text-hero-ink-muted">
                <span className="font-bold text-hero-accent">$5</span> off · refer for{" "}
                <span className="font-bold text-hero-accent">$10</span>
              </span>
            </span>
            <ChevronRight className="ml-0.5 h-4 w-4 shrink-0 text-hero-clay transition-transform group-hover:translate-x-0.5" />
          </m.button>
        ) : (
          <m.div
            key="full"
            role="region"
            aria-label="Offers"
            initial={shouldAnimate ? { opacity: 0, y: -6 } : undefined}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
            exit={shouldAnimate ? { opacity: 0, scale: 0.97 } : undefined}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={cn(
              "relative flex items-center gap-3 overflow-hidden rounded-2xl hero-surface-vellum px-4 py-3",
              "ring-1 ring-hero-line"
            )}
          >
            {/* Gift mark with a soft halo + gentle motion-safe sway */}
            <m.span
              aria-hidden="true"
              className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-hero-clay/15 text-hero-clay ring-1 ring-hero-clay/25"
              animate={shouldAnimate ? { rotate: [0, -8, 8, -4, 0] } : undefined}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 2.5 }}
            >
              <Gift className="h-5 w-5" />
              <Sparkles className="absolute -right-0.5 -top-0.5 h-3 w-3 text-hero-accent" />
            </m.span>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-hero-ink">
                New here? <strong className="font-semibold text-hero-accent">$5 off</strong> your
                first $50+ order · Refer a friend —{" "}
                <strong className="font-semibold text-hero-accent">you both get $10</strong>
              </p>
              <p className="mt-0.5 font-burmese text-xs text-hero-ink-muted">
                ပထမဆုံးအော်ဒါ $၅ လျှော့ · မိတ်ဆွေကို ဖိတ်ရင် နှစ်ယောက်စလုံး $၁၀ — ချစ်ရင်
                ပြောပြလိုက်ပါနော် 😘
              </p>
            </div>

            <Link
              href={`/account?tab=settings&src=${encodeURIComponent(source)}`}
              className={cn(
                "group hidden shrink-0 items-center gap-1 rounded-full bg-hero-accent px-4 py-1.5",
                "text-sm font-semibold text-hero-card transition-colors hover:bg-hero-accent-strong sm:inline-flex",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-accent/40"
              )}
            >
              Share &amp; earn
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <button
              type="button"
              onClick={collapse}
              aria-label="Collapse offer"
              className={cn(
                "shrink-0 rounded-full p-1 text-hero-ink-muted transition-colors",
                "hover:bg-hero-card hover:text-hero-ink",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-clay/40"
              )}
            >
              <X className="h-4 w-4" />
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default OfferBanner;
