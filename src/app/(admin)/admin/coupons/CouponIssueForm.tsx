"use client";

import { useState } from "react";
import { Loader2, Truck, DollarSign, Percent } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/hooks/useToastV8";
import type { CouponKind } from "@/lib/coupons/effect";
import { cn } from "@/lib/utils/cn";
import { toISOWithTimezone } from "@/lib/utils/delivery-timezone";

import type { AdminCoupon } from "./types";

const KINDS: { value: CouponKind; label: string; icon: typeof Truck }[] = [
  { value: "free_delivery", label: "Free delivery", icon: Truck },
  { value: "amount_off", label: "$ off", icon: DollarSign },
  { value: "percent_off", label: "% off", icon: Percent },
];

/** "12.50" → 1250; blank → undefined. */
function toCents(v: string): number | undefined {
  if (!v.trim()) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : undefined;
}

/**
 * A date input's day → 23:59:59 that day in LOS ANGELES (the business time
 * zone — the email and every delivery date use it), independent of the
 * admin's browser time zone.
 */
function endOfDayIso(date: string): string | undefined {
  if (!date) return undefined;
  return new Date(Date.parse(toISOWithTimezone(date, "23:59")) + 59_000).toISOString();
}

export function CouponIssueForm({ onIssued }: { onIssued: (created: AdminCoupon[]) => void }) {
  const [kind, setKind] = useState<CouponKind>("free_delivery");
  const [amount, setAmount] = useState("");
  const [percent, setPercent] = useState("");
  const [cap, setCap] = useState("");
  const [minimum, setMinimum] = useState("");
  const [expires, setExpires] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [email, setEmail] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const qty = Math.max(1, Math.min(50, Math.floor(Number(quantity) || 1)));
  const single = qty === 1;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          amountOffCents: kind === "amount_off" ? toCents(amount) : undefined,
          percentOff: kind === "percent_off" ? Math.round(Number(percent)) || undefined : undefined,
          maxDiscountCents: kind === "amount_off" ? undefined : toCents(cap),
          minSubtotalCents: toCents(minimum) ?? 0,
          expiresAt: endOfDayIso(expires),
          quantity: qty,
          code: single && code.trim() ? code.trim() : undefined,
          assignEmail: single && email.trim() ? email.trim() : undefined,
          sendEmail: single && !!email.trim() && sendEmail,
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ type: "error", message: data.error ?? "Failed to issue coupon" });
        return;
      }
      const created = (data.coupons ?? []) as AdminCoupon[];
      const sent = data.emailSent ? " and emailed to the customer" : "";
      toast({
        type:
          data.emailSent === false && single && email.trim() && sendEmail ? "warning" : "success",
        message:
          created.length === 1
            ? `Issued ${created[0].code}${sent}${
                !data.emailSent && single && email.trim() && sendEmail
                  ? " — email failed, share the code manually"
                  : ""
              }`
            : `Issued ${created.length} coupons`,
      });
      onIssued(created);
      setCode("");
      setEmail("");
      setNote("");
    } catch {
      toast({ type: "error", message: "Failed to issue coupon" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-5 rounded-card border border-border-subtle bg-surface-primary p-4 md:p-6"
    >
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-text-primary">Coupon type</legend>
        <div className="grid grid-cols-3 gap-2" role="radiogroup">
          {KINDS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={kind === value}
              onClick={() => setKind(value)}
              className={cn(
                "flex min-h-11 items-center justify-center gap-1.5 rounded-lg border px-2 text-sm font-medium transition-colors",
                kind === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border-subtle text-text-secondary hover:bg-surface-secondary"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        {kind === "amount_off" && (
          <Field id="amount" label="Amount off ($)">
            <Input
              id="amount"
              inputMode="decimal"
              placeholder="10.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </Field>
        )}
        {kind === "percent_off" && (
          <Field id="percent" label="Percent off">
            <Input
              id="percent"
              inputMode="numeric"
              placeholder="15"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              required
            />
          </Field>
        )}
        {kind !== "amount_off" && (
          <Field
            id="cap"
            label={
              kind === "free_delivery"
                ? "Cap on fee waived ($, optional)"
                : "Max discount ($, optional)"
            }
            hint={
              kind === "free_delivery"
                ? "Blank = waive the full fee, including extended-distance fees."
                : undefined
            }
          >
            <Input
              id="cap"
              inputMode="decimal"
              placeholder="No cap"
              value={cap}
              onChange={(e) => setCap(e.target.value)}
            />
          </Field>
        )}
        <Field id="minimum" label="Minimum food subtotal ($, optional)">
          <Input
            id="minimum"
            inputMode="decimal"
            placeholder="None"
            value={minimum}
            onChange={(e) => setMinimum(e.target.value)}
          />
        </Field>
        <Field id="expires" label="Expires (optional)" hint="Valid through the end of this day.">
          <Input
            id="expires"
            type="date"
            value={expires}
            onChange={(e) => setExpires(e.target.value)}
          />
        </Field>
        <Field
          id="quantity"
          label="How many codes"
          hint="Up to 50 unique codes at once, e.g. for flyers."
        >
          <Input
            id="quantity"
            type="number"
            min={1}
            max={50}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </Field>
      </div>

      {single && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="email"
            label="Give to a customer (email, optional)"
            hint="Only that account can use it."
          >
            <Input
              id="email"
              type="email"
              autoComplete="off"
              placeholder="customer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field
            id="code"
            label="Custom code (optional)"
            hint="Blank = auto-generate. Letters, digits, dashes."
          >
            <Input
              id="code"
              className="uppercase"
              placeholder="e.g. SORRY-ABC"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={32}
            />
          </Field>
          {email.trim() && (
            <label className="flex min-h-11 items-center gap-2 text-sm text-text-primary sm:col-span-2">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
              />
              Email the code to this customer
            </label>
          )}
        </div>
      )}

      <Field id="note" label="Internal note (optional)">
        <Input
          id="note"
          maxLength={200}
          placeholder="e.g. Late delivery on 9/20"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>

      <Button type="submit" disabled={submitting} className="min-h-11 w-full sm:w-auto">
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
        {single ? "Issue coupon" : `Issue ${qty} coupons`}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  );
}
