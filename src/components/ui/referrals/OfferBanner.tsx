"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { m, AnimatePresence } from "framer-motion";
import { Gift, X, ArrowRight, ChevronRight, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { Modal } from "@/components/ui/Modal/Modal";
import type { RewardsReferral } from "@/lib/hooks/useRewards";

// Lazy — the share card (+ its referral fetch) only loads when the modal opens,
// so it never weighs on the homepage/menu/checkout first paint.
const ReferAFriendCard = dynamic(
  () => import("@/components/ui/referrals/ReferAFriendCard").then((m) => m.ReferAFriendCard),
  {
    ssr: false,
    loading: () => (
      <div className="p-8 text-center text-sm text-hero-ink-muted">Loading your link…</div>
    ),
  }
);

const COLLAPSE_KEY = "mms_offer_banner_collapsed";
// Legacy permanent-dismiss flag — returning users who dismissed before now see
// the collapsed pill (still reachable), not the full banner again.
const LEGACY_DISMISS_KEY = "mms_offer_banner_dismissed";

interface OfferBannerProps {
  className?: string;
  /** Attribution tag appended to the share link. */
  source?: string;
  /** Preview override — opens the share modal pre-filled (skips auth/fetch). */
  previewReferral?: RewardsReferral;
}

/**
 * Warm-paper awareness strip for the welcome + referral offers, on high-intent
 * surfaces (homepage, menu, checkout). "Dismiss" COLLAPSES it to a small,
 * re-expandable rewards pill rather than hiding it forever — so the offer
 * persists without nagging. Renders nothing until the flag is read (no flash).
 */
export function OfferBanner({ className, source = "banner", previewReferral }: OfferBannerProps) {
  const { shouldAnimate } = useAnimationPreference();
  const { isAuthenticated } = useAuth();
  const [ready, setReady] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    try {
      // COLLAPSE_KEY is authoritative once set (even "0", so expand() persists);
      // only fall back to the legacy permanent-dismiss flag when it's absent.
      const flag = localStorage.getItem(COLLAPSE_KEY);
      if (flag !== null) setCollapsed(flag === "1");
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
    // Centered (no lone left pill) + a clean opacity crossfade. No framer
    // `layout`/`popLayout` here — those need domMax, which the public-page
    // bundle (domAnimation) doesn't load, so the swap behaves identically on
    // homepage / menu / checkout.
    <div className={cn("relative flex justify-center", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {collapsed ? (
          <m.button
            key="pill"
            type="button"
            onClick={expand}
            aria-label="Show rewards offer — $5 off your first order, and refer a friend for $10"
            initial={shouldAnimate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={shouldAnimate ? { opacity: 0 } : undefined}
            transition={{ duration: shouldAnimate ? 0.2 : 0 }}
            className={cn(
              "group inline-flex items-center gap-2.5 rounded-full hero-surface-paper py-1.5 pl-1.5 pr-4",
              "shadow-sm ring-1 ring-hero-line transition-shadow duration-300 hover:shadow-md",
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
            initial={shouldAnimate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={shouldAnimate ? { opacity: 0 } : undefined}
            transition={{ duration: shouldAnimate ? 0.2 : 0 }}
            className={cn(
              "relative flex w-full items-center gap-3 overflow-hidden rounded-2xl hero-surface-vellum px-3.5 py-3 sm:px-4",
              "ring-1 ring-hero-line"
            )}
          >
            {/* Gift mark with a soft halo + gentle motion-safe sway */}
            <m.span
              aria-hidden="true"
              className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-hero-clay/15 text-hero-clay ring-1 ring-hero-clay/25"
              animate={shouldAnimate ? { rotate: [0, -8, 8, -4, 0] } : undefined}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
                repeatDelay: 2.5,
              }}
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

            {/* Opens a share modal instead of leaving checkout — keeps momentum
                on a high-intent surface. Compact (icon-only) on mobile. */}
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              aria-label="Share & earn — refer a friend"
              className={cn(
                "group inline-flex shrink-0 items-center gap-1 rounded-full bg-hero-accent px-3 py-1.5 sm:px-4",
                "text-sm font-semibold text-hero-card transition-colors hover:bg-hero-accent-strong",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-accent/40"
              )}
            >
              <Gift className="h-4 w-4 sm:hidden" aria-hidden="true" />
              <span className="hidden sm:inline">Share &amp; earn</span>
              <ArrowRight className="hidden h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 sm:block" />
            </button>

            <button
              type="button"
              onClick={collapse}
              aria-label="Collapse offer"
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-full text-hero-ink-muted transition-colors",
                "hover:bg-hero-card hover:text-hero-ink",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-clay/40"
              )}
            >
              <X className="h-4 w-4" />
            </button>
          </m.div>
        )}
      </AnimatePresence>

      <Modal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Refer a friend — you both get $10"
        size="md"
      >
        {isAuthenticated || previewReferral ? (
          <ReferAFriendCard data={previewReferral} />
        ) : (
          <div className="px-1 py-2 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-hero-clay/15 text-hero-clay ring-1 ring-hero-clay/20">
              <Gift className="h-6 w-6" />
            </span>
            <p className="mt-3 text-sm font-medium text-hero-ink">
              Sign in to grab your link — you both get{" "}
              <strong className="font-semibold text-hero-accent">$10</strong>.
            </p>
            <p className="mt-1 font-burmese text-xs text-hero-ink-muted" lang="my">
              လင့်ခ်ရဖို့ ဝင်ပါ — နှစ်ယောက်စလုံး $၁၀ ရမယ်နော်။
            </p>
            <Link
              href={`/login?src=${encodeURIComponent(source)}`}
              onClick={() => setShareOpen(false)}
              className={cn(
                "mt-4 inline-flex items-center gap-1 rounded-full bg-hero-accent px-5 py-2",
                "text-sm font-semibold text-hero-card transition-colors hover:bg-hero-accent-strong",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-accent/40"
              )}
            >
              Sign in
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default OfferBanner;
