"use client";

import { useEffect, useState } from "react";
import { Gift, Copy, Check } from "lucide-react";

import { formatPrice } from "@/lib/utils/currency";

interface ReferralData {
  code: string;
  shareUrl: string;
  rewardCents: number;
  stats: { pending: number; completed: number; earnedCents: number };
}

/**
 * "Refer a friend" card — shows the customer's share link, a copy button, and
 * their referral stats. Renders nothing until the API responds, so it never
 * flashes a broken state.
 */
export function ReferAFriendCard() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/referrals", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (active) setData(json?.data ?? null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!data) return null;

  const reward = formatPrice(data.rewardCents);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(data.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — the field is selectable as a fallback.
    }
  };

  return (
    <section className="rounded-card bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/15 p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Gift className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-text-primary">
            Give {reward}, get {reward}
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            Share your link — your friend gets {reward} off their first order ($50+), and you get{" "}
            {reward} off your next meal when they order.
          </p>

          <div className="mt-4 flex items-center gap-2">
            <input
              readOnly
              value={data.shareUrl}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Your referral link"
              className="min-w-0 flex-1 rounded-xl border border-border bg-surface-primary px-3 py-2 text-sm text-text-secondary"
            />
            <button
              type="button"
              onClick={copy}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-primary-hover"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span className="text-text-secondary">
              <strong className="text-text-primary">{data.stats.completed}</strong> joined
            </span>
            <span className="text-text-secondary">
              <strong className="text-text-primary">{data.stats.pending}</strong> pending
            </span>
            <span className="text-text-secondary">
              <strong className="text-green">{formatPrice(data.stats.earnedCents)}</strong> earned
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ReferAFriendCard;
