"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { Gift, Copy, Check, MessageCircle, Send, Share2, RotateCw } from "lucide-react";

import { formatPrice } from "@/lib/utils/currency";
import { useReferral, type RewardsReferral } from "@/lib/hooks/useRewards";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { duration, easing } from "@/lib/motion-tokens";
import { COPIED, COPY_FALLBACK, LOAD_ERROR, RETRY } from "@/lib/loyalty/copy";

const SHARE_MESSAGE =
  "I love Mandalay Morning Star — real Burmese food delivered across LA 🍜 Use my link for $10 off your first order (I get $10 too)! ချစ်ရင် ပြောပြလိုက်တာပါနော် 😘";

/** Append a channel source for attribution. shareUrl already carries ?ref=. */
function withSrc(shareUrl: string, src: string): string {
  return `${shareUrl}${shareUrl.includes("?") ? "&" : "?"}src=${src}`;
}

interface ReferAFriendCardProps {
  /** Pre-fetched referral data (e.g. from the Rewards hub). When omitted, the
   * card self-fetches via React Query (with its own error/retry). */
  data?: RewardsReferral;
}

/**
 * "Refer a friend" card — share link, copy, stats. When handed `data` it renders
 * immediately; otherwise it self-fetches and shows a skeleton/error+retry rather
 * than silently vanishing on failure.
 */
export function ReferAFriendCard({ data: dataProp }: ReferAFriendCardProps = {}) {
  const { shouldAnimate } = useAnimationPreference();
  const self = useReferral(!dataProp);
  const data = dataProp ?? self.data;

  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  // Self-fetch error (only when not handed data) → compact retry.
  if (!dataProp && self.isError) {
    return (
      <section
        role="alert"
        className="rounded-card border border-border-subtle bg-surface-primary p-5 text-center"
      >
        <p className="text-sm text-text-secondary">{LOAD_ERROR.en}</p>
        <button
          type="button"
          onClick={() => self.refetch()}
          disabled={self.isFetching}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-secondary disabled:opacity-60"
        >
          <RotateCw className={self.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          {RETRY.en}
        </button>
      </section>
    );
  }

  if (!data) return null;

  const reward = formatPrice(data.rewardCents);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(data.shareUrl);
      setCopied(true);
      setCopyFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyFailed(true);
    }
  };

  const shareText = (src: string) => `${SHARE_MESSAGE} ${withSrc(data.shareUrl, src)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText("whatsapp"))}`;
  const viberUrl = `viber://forward?text=${encodeURIComponent(shareText("viber"))}`;

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Mandalay Morning Star",
          text: SHARE_MESSAGE,
          url: withSrc(data.shareUrl, "share"),
        });
      } catch {
        // user cancelled
      }
    } else {
      void copy();
    }
  };

  return (
    <m.section
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: duration.normal, ease: easing.out }}
      className="rounded-card bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/15 p-5"
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
          aria-hidden="true"
        >
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
          <p lang="my" className="mt-1 text-sm text-text-muted">
            သူငယ်ချင်းကို မျှဝေပါ — သူတို့ {reward} လျှော့ရမယ်၊ မှာပြီးရင် သင်လည်း {reward}{" "}
            ပြန်ရမယ်နော်။
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
              aria-label={copied ? "Referral link copied" : "Copy referral link"}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-primary-hover"
            >
              {copied ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          {/* aria-live feedback for copy result */}
          <span role="status" aria-live="polite" className="sr-only">
            {copied ? COPIED.en : copyFailed ? COPY_FALLBACK.en : ""}
          </span>

          {/* Share to the apps the LA Burmese community actually uses */}
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share referral link via WhatsApp"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-primary px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary"
            >
              <MessageCircle className="h-4 w-4 text-green" aria-hidden="true" /> WhatsApp
            </a>
            <a
              href={viberUrl}
              aria-label="Share referral link via Viber"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-primary px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary"
            >
              <Send className="h-4 w-4 text-accent-secondary" aria-hidden="true" /> Viber
            </a>
            <button
              type="button"
              onClick={nativeShare}
              aria-label="Share referral link"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-primary px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary"
            >
              <Share2 className="h-4 w-4 text-primary" aria-hidden="true" /> More
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
    </m.section>
  );
}

export default ReferAFriendCard;
