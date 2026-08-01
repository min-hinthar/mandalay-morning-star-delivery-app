"use client";

import { m } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useCartStore } from "@/lib/stores/cart-store";

/** A ledger row: muted label left, value right; subtle slide-in. */
export function LedgerRow({
  label,
  children,
  shouldAnimate,
  delay = 0,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  shouldAnimate: boolean;
  delay?: number;
}) {
  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, x: -10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
      transition={{ delay, type: "spring", stiffness: 300, damping: 25 }}
      className="flex justify-between text-sm text-hero-ink-muted"
    >
      <span>{label}</span>
      {children}
    </m.div>
  );
}

/** A gentle fade/rise wrapper for the delivery-status callouts. */
export function FadeRow({
  children,
  shouldAnimate,
  getSpring,
}: {
  children: React.ReactNode;
  shouldAnimate: boolean;
  getSpring: ReturnType<typeof useAnimationPreference>["getSpring"];
}) {
  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={getSpring(spring.gentle)}
    >
      {children}
    </m.div>
  );
}

/**
 * Below-minimum warning on the checkout receipt. The /cart page's summary has
 * carried this row all along, but the checkout summary never did — so a cart
 * that slipped in under the floor (drawer entry, or items removed mid-checkout)
 * sailed through all three steps and only learned at Place Order
 * (MINIMUM_ORDER_NOT_MET). Same engine + tier as the server gate.
 */
export function MinimumShortfallNotice({
  shouldAnimate,
  getSpring,
}: {
  shouldAnimate: boolean;
  getSpring: ReturnType<typeof useAnimationPreference>["getSpring"];
}) {
  const minimumOrder = useCartStore(useShallow((s) => s.getMinimumOrder()));
  if (minimumOrder.shortfallCents <= 0) return null;

  return (
    <FadeRow shouldAnimate={shouldAnimate} getSpring={getSpring}>
      <div
        role="status"
        className="rounded-xl border border-status-error/30 bg-status-error/10 p-3"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm font-semibold text-status-error">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {minimumOrder.isExtendedMinimum ? "Below long-distance minimum" : "Below minimum"}
          </span>
          <span className="text-sm font-semibold text-status-error">
            ${(minimumOrder.shortfallCents / 100).toFixed(2)} short
          </span>
        </div>
        {/* Say WHY the floor is higher out here — a bare "below minimum" on a
            $90 order reads as a bug to a far customer. */}
        {minimumOrder.isExtendedMinimum && (
          <p className="mt-1 pl-6 text-xs leading-snug text-hero-ink-muted">
            Deliveries to your area need a ${(minimumOrder.minimumCents / 100).toFixed(0)} minimum —
            it&rsquo;s a long drive, so we group them into bigger orders.{" "}
            <span className="font-burmese" lang="my">
              ခရီးဝေးပို့ဆောင်မှုအတွက် အနည်းဆုံး ${(minimumOrder.minimumCents / 100).toFixed(0)}{" "}
              မှာယူပေးပါ။
            </span>
          </p>
        )}
      </div>
    </FadeRow>
  );
}
