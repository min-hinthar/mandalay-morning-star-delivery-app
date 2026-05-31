"use client";

import { useState } from "react";
import { Copy, Check, Ticket, Gift } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/currency";

export interface WalletItem {
  id: string;
  code: string;
  kind: "loyalty" | "referral";
  amountCents: number;
  label: string;
  createdAt: string;
}

function WalletCard({ item }: { item: WalletItem }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(item.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — the code is still visible to type manually.
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-primary p-3">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          item.kind === "loyalty"
            ? "bg-primary/10 text-primary"
            : "bg-accent-teal/10 text-accent-teal"
        )}
      >
        {item.kind === "loyalty" ? <Gift className="h-5 w-5" /> : <Ticket className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-primary">
          {formatPrice(item.amountCents)} off · {item.label}
        </p>
        <p className="truncate font-mono text-xs tracking-wider text-text-secondary">{item.code}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy code ${item.code}`}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-primary-hover"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

/** The customer's coupon wallet — loyalty + referral rewards, one-tap copy. */
export function CouponWallet({ items }: { items: WalletItem[] }) {
  return (
    <section className="rounded-card border border-border-subtle bg-surface-primary p-5">
      <h3 className="text-base font-semibold text-text-primary">Your coupons</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-text-secondary">
          No coupons yet — earn a Star with every order, and a $5 thank-you every 5 orders. New
          here? Your first $50+ order gets a welcome discount automatically.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-text-secondary">
            Use at checkout on orders $50+ · ချက်အောက်မှာသုံးပါနော်
          </p>
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
