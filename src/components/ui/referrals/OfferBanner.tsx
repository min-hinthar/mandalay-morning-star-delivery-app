"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gift, X } from "lucide-react";

import { cn } from "@/lib/utils/cn";

const DISMISS_KEY = "mms_offer_banner_dismissed";

interface OfferBannerProps {
  className?: string;
  /** Attribution tag appended to the share link. */
  source?: string;
}

/**
 * Slim, dismissible, bilingual awareness strip for the welcome + referral
 * offers. Placed on high-intent surfaces (homepage, menu, checkout). Renders
 * nothing until we've checked the dismissal flag, so there's no flash.
 */
export function OfferBanner({ className, source = "banner" }: OfferBannerProps) {
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  if (!ready || dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  return (
    <div
      className={cn(
        "relative flex items-center gap-3 rounded-2xl border border-secondary/30 px-4 py-3",
        "bg-gradient-to-r from-secondary/10 via-primary/5 to-secondary/10",
        className
      )}
      role="region"
      aria-label="Offers"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Gift className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary">
          New here? <strong className="text-primary">$5 off</strong> your first $50+ order · Refer a
          friend — <strong className="text-primary">you both get $10</strong>
        </p>
        <p className="mt-0.5 text-xs text-text-secondary">
          ပထမဆုံးအော်ဒါ $၅ လျှော့ · မိတ်ဆွေကို ဖိတ်ရင် နှစ်ယောက်စလုံး $၁၀ — ချစ်ရင်
          ပြောပြလိုက်ပါနော် 😘
        </p>
      </div>

      <Link
        href={`/account?tab=settings&src=${encodeURIComponent(source)}`}
        className="hidden shrink-0 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-text-inverse transition-colors hover:bg-primary-hover sm:inline-block"
      >
        Share &amp; earn
      </Link>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss offer"
        className="shrink-0 rounded-full p-1 text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default OfferBanner;
