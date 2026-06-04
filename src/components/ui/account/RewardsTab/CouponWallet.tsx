"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Copy, Check, Ticket, Gift, ArrowRight, Clock } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/currency";
import { daysUntilExpiry, LOYALTY_EXPIRING_SOON_DAYS } from "@/lib/loyalty";
import { Bilingual } from "@/components/ui/Bilingual";
import {
  COPIED,
  COPY_FALLBACK,
  WALLET_EMPTY,
  WALLET_USE_HINT,
  expiryLabel,
} from "@/lib/loyalty/copy";

const COPY_RESET_MS = 2000;

export interface WalletItem {
  id: string;
  code: string;
  kind: "loyalty" | "referral";
  amountCents: number;
  label: string;
  createdAt: string;
  expiresAt: string | null;
}

function WalletCard({ item }: { item: WalletItem }) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const codeRef = useRef<HTMLParagraphElement>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(item.code);
      setCopied(true);
      setCopyFailed(false);
      setTimeout(() => setCopied(false), COPY_RESET_MS);
    } catch {
      // Clipboard blocked (insecure context / permissions) — select the code so
      // the customer can copy manually, and tell them how.
      setCopyFailed(true);
      const node = codeRef.current;
      if (node) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  };

  const daysLeft = daysUntilExpiry(item.expiresAt);
  const expiringSoon = daysLeft != null && daysLeft <= LOYALTY_EXPIRING_SOON_DAYS;
  const expiry = daysLeft != null ? expiryLabel(daysLeft) : null;
  const amount = formatPrice(item.amountCents);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-primary p-3">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          item.kind === "loyalty"
            ? "bg-primary/10 text-primary"
            : "bg-accent-teal/10 text-accent-teal"
        )}
        aria-hidden="true"
      >
        {item.kind === "loyalty" ? <Gift className="h-5 w-5" /> : <Ticket className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-primary">
          {amount} off · {item.label}
        </p>
        <p ref={codeRef} className="truncate font-mono text-xs tracking-wider text-text-secondary">
          {item.code}
        </p>
        {expiry && (
          <p
            lang="my"
            className={cn(
              "mt-0.5 inline-flex items-center gap-1 text-xs",
              expiringSoon ? "font-medium text-status-warning" : "text-text-muted"
            )}
          >
            <Clock className="h-3 w-3" aria-hidden="true" />
            <span>{expiry.my}</span>
          </p>
        )}
        {/* aria-live feedback for copy result (visually hidden) */}
        <span role="status" aria-live="polite" className="sr-only">
          {copied ? COPIED.en : copyFailed ? COPY_FALLBACK.en : ""}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? `Copied code ${item.code}` : `Copy code ${item.code}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
        >
          {copied ? (
            <Check className="h-4 w-4 text-status-success" aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
        <Link
          href={`/checkout?promo=${encodeURIComponent(item.code)}`}
          aria-label={`Use ${amount} reward at checkout`}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-primary-hover"
        >
          Use
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

/** The customer's coupon wallet — loyalty + referral rewards, one-tap copy. */
export function CouponWallet({ items }: { items: WalletItem[] }) {
  return (
    <section className="rounded-card border border-border-subtle bg-surface-primary p-5">
      <h3 className="text-base font-semibold text-text-primary">Your coupons</h3>
      {items.length === 0 ? (
        <Bilingual
          text={WALLET_EMPTY}
          className="mt-2 block text-sm text-text-secondary"
          myClassName="mt-1 text-text-muted"
        />
      ) : (
        <>
          <Bilingual
            text={WALLET_USE_HINT}
            inline
            className="mt-1 block text-sm text-text-secondary"
          />
          <div className="mt-4 space-y-2">
            {items.map((item) => (
              <WalletCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default CouponWallet;
