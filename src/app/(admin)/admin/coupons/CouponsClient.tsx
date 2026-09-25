"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, Loader2, Ticket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { couponLabel, type CouponKind } from "@/lib/coupons/effect";
import type { CouponStatus } from "@/lib/coupons/status";
import { toast } from "@/lib/hooks/useToastV8";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/currency";

import { CouponIssueForm } from "./CouponIssueForm";
import type { AdminCoupon } from "./types";

const STATUS_STYLES: Record<CouponStatus, string> = {
  active: "bg-status-success/10 text-status-success",
  in_checkout: "bg-status-info/10 text-status-info",
  redeemed: "bg-primary/10 text-primary",
  expired: "bg-surface-tertiary text-text-muted",
  revoked: "bg-status-error/10 text-status-error",
};

const STATUS_LABELS: Record<CouponStatus, string> = {
  active: "Active",
  in_checkout: "In checkout",
  redeemed: "Redeemed",
  expired: "Expired",
  revoked: "Revoked",
};

type Filter = "all" | "active" | "redeemed" | "closed";
const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "redeemed", label: "Redeemed" },
  { value: "closed", label: "Expired / revoked" },
];

function matches(filter: Filter, s: CouponStatus): boolean {
  if (filter === "all") return true;
  if (filter === "active") return s === "active" || s === "in_checkout";
  if (filter === "redeemed") return s === "redeemed";
  return s === "expired" || s === "revoked";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function CouponsClient() {
  const [coupons, setCoupons] = useState<AdminCoupon[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [revoking, setRevoking] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/coupons", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCoupons(data.coupons ?? []);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function revoke(c: AdminCoupon) {
    if (!window.confirm(`Revoke ${c.code}? It can no longer be used.`)) return;
    setRevoking(c.id);
    try {
      const res = await fetch(`/api/admin/coupons/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke" }),
      });
      if (!res.ok) throw new Error();
      toast({ type: "success", message: `${c.code} revoked` });
      await load();
    } catch {
      toast({ type: "error", message: "Failed to revoke coupon" });
    } finally {
      setRevoking(null);
    }
  }

  const visible = (coupons ?? []).filter((c) => matches(filter, c.status));
  const activeCount = (coupons ?? []).filter((c) => c.status === "active").length;
  const redeemedCount = (coupons ?? []).filter((c) => c.status === "redeemed").length;

  return (
    <div className="space-y-8">
      <section aria-labelledby="issue-heading" className="max-w-3xl">
        <h2 id="issue-heading" className="mb-3 text-lg font-semibold text-text-primary">
          Issue a coupon
        </h2>
        <CouponIssueForm onIssued={() => void load()} />
      </section>

      <section aria-labelledby="list-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="list-heading" className="text-lg font-semibold text-text-primary">
              Issued coupons
            </h2>
            {coupons && (
              <p className="text-sm text-text-muted">
                {activeCount} active · {redeemedCount} redeemed
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter coupons">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                role="tab"
                aria-selected={filter === f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "min-h-11 rounded-full px-3.5 text-sm font-medium transition-colors",
                  filter === f.value
                    ? "bg-primary text-text-inverse"
                    : "bg-surface-secondary text-text-secondary hover:bg-surface-tertiary"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loadError ? (
          <p className="text-status-error">
            Failed to load coupons.{" "}
            <button type="button" className="underline" onClick={() => void load()}>
              Retry
            </button>
          </p>
        ) : coupons === null ? (
          <div className="flex items-center gap-2 text-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading…
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-border-subtle p-12 text-center">
            <Ticket className="h-10 w-10 text-text-muted" aria-hidden="true" />
            <p className="font-medium text-text-primary">No coupons here yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-border-subtle overflow-hidden rounded-card border border-border-subtle bg-surface-primary">
            {visible.map((c) => (
              <CouponListRow key={c.id} coupon={c} revoking={revoking === c.id} onRevoke={revoke} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function CouponListRow({
  coupon: c,
  revoking,
  onRevoke,
}: {
  coupon: AdminCoupon;
  revoking: boolean;
  onRevoke: (c: AdminCoupon) => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(c.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ type: "error", message: "Couldn't copy — select the code manually" });
    }
  }

  const terms = [
    c.min_subtotal_cents > 0 ? `min ${formatPrice(c.min_subtotal_cents)}` : null,
    c.expires_at ? `expires ${formatDate(c.expires_at)}` : "no expiry",
    c.assignedEmail ? `for ${c.assignedEmail}` : "anyone",
  ].filter(Boolean);

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copy}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-surface-secondary px-2.5 font-mono text-sm font-semibold tracking-wide text-text-primary hover:bg-surface-tertiary"
            aria-label={`Copy code ${c.code}`}
          >
            {c.code}
            {copied ? (
              <Check className="h-3.5 w-3.5 text-status-success" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
            )}
          </button>
          <span className="text-sm font-medium text-text-primary">
            {couponLabel(c.kind as CouponKind, c)}
          </span>
          <span
            className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLES[c.status])}
          >
            {STATUS_LABELS[c.status]}
          </span>
        </div>
        <p className="text-xs text-text-muted">{terms.join(" · ")}</p>
        {c.note && <p className="text-xs italic text-text-secondary">{c.note}</p>}
        {c.status === "redeemed" && c.order_id && (
          <p className="text-xs text-text-secondary">
            Used{c.redeemedEmail ? ` by ${c.redeemedEmail}` : ""}
            {c.redeemed_at ? ` on ${formatDate(c.redeemed_at)}` : ""} ·{" "}
            <Link
              href={`/admin/orders/${c.order_id}`}
              className="font-medium text-primary underline"
            >
              View order
            </Link>
          </p>
        )}
      </div>
      {(c.status === "active" || c.status === "in_checkout") && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11 shrink-0 self-start sm:self-center"
          disabled={revoking}
          onClick={() => onRevoke(c)}
        >
          {revoking ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Revoke"}
        </Button>
      )}
    </li>
  );
}
