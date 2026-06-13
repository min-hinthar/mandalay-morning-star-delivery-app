"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { AlertTriangle, Expand, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useDeliveryGate, useDeliveryGateMultiDay } from "@/lib/hooks/useDeliveryGate";
import { getNextCutoffText } from "@/lib/utils/delivery-schedule";
import { Button } from "@/components/ui/button";
import { DeliveryCountdown } from "@/components/ui/delivery";
import { CartSummary } from "./CartSummary";
import type { DeliveryDayConfig } from "@/types/delivery";

// ============================================
// CART FOOTER — split into a scrollable receipt + a pinned action bar.
//
// The receipt (delivery row + CartSummary) is ~600px tall; pinning it as a
// non-scrolling block buried the item list and overflowed its own buttons on
// short/constrained drawers (iPad Chrome, esp. landscape — the toolbar steals
// height). So the receipt now lives INSIDE the drawer's single scroll region
// (see CartDrawer), and only the compact checkout CTA stays pinned at the
// bottom — reachable at every viewport height.
// ============================================

interface CartGateInput {
  hasBlockingIssues?: boolean;
  /** Multi-day delivery configs from DB */
  deliveryDays?: DeliveryDayConfig[];
  /** @deprecated Legacy cutoff day (0=Sun..6=Sat). Use deliveryDays. */
  cutoffDay?: number;
  /** @deprecated Legacy cutoff hour (0-23). Use deliveryDays. */
  cutoffHour?: number;
}

/**
 * Compute the delivery gate once for the drawer so the receipt's delivery row
 * and the pinned checkout CTA share a single, consistent source of truth
 * (avoids two countdown timers / divergent open-state).
 */
export function useCartDeliveryGate({
  hasBlockingIssues = false,
  deliveryDays,
  cutoffDay = 5,
  cutoffHour = 15,
}: CartGateInput) {
  const hasMultiDay = deliveryDays !== undefined && deliveryDays.length > 0;
  const multiDayGate = useDeliveryGateMultiDay(deliveryDays ?? []);
  const legacyGate = useDeliveryGate(cutoffDay, cutoffHour);
  const gate = hasMultiDay ? multiDayGate : legacyGate;

  const isDisabled = hasBlockingIssues || !gate.isOpen;
  const closedText =
    hasMultiDay && gate.deliveryDayOfWeek !== undefined
      ? getNextCutoffText(gate.deliveryDayOfWeek, deliveryDays!)
      : `Checkout opens Friday at 3:00 PM`;

  return { gate, isDisabled, closedText };
}

export type CartDeliveryGateState = ReturnType<typeof useCartDeliveryGate>;

// ============================================
// RECEIPT — delivery row + living ledger. Flows inside the scroll region.
// ============================================

interface CartReceiptProps {
  gateState: CartDeliveryGateState;
  className?: string;
}

export function CartReceipt({ gateState, className }: CartReceiptProps) {
  const { gate, closedText } = gateState;

  return (
    <div className={cn("px-5 pb-4 pt-1", className)}>
      {/* Delivery info row */}
      <div className="mb-3 flex items-center justify-between rounded-lg border border-border bg-surface-elevated px-3 py-2">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-3.5 w-3.5 shrink-0 text-hero-clay" />
          <span className="text-xs text-text-muted">
            {gate.isOpen ? (
              <>
                Delivery{" "}
                <span className="font-medium text-text-primary">
                  {gate.deliveryDate.displayDate}
                </span>
              </>
            ) : (
              <span className="font-medium text-amber-600 dark:text-amber-400">{closedText}</span>
            )}
          </span>
        </div>
        {gate.isOpen && (
          <DeliveryCountdown
            cutoffDate={gate.cutoffDate}
            urgency={gate.urgency}
            className="text-xs"
          />
        )}
      </div>

      <CartSummary />
    </div>
  );
}

// ============================================
// ACTIONS — compact CTA bar. Pinned at the drawer bottom (always reachable).
// ============================================

interface CartActionsProps {
  gateState: CartDeliveryGateState;
  onClose: () => void;
  onCheckout: () => void;
  hasBlockingIssues?: boolean;
  showFullCartLink?: boolean;
}

export function CartActions({
  gateState,
  onClose,
  onCheckout,
  hasBlockingIssues = false,
  showFullCartLink,
}: CartActionsProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const { gate, isDisabled, closedText } = gateState;

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{ delay: 0.2 }}
      className="menu-sheet-footer safe-area-inset-bottom shrink-0 border-t border-border px-5 py-4"
    >
      <div className="flex flex-col gap-3">
        <m.div
          whileHover={shouldAnimate && !isDisabled ? { scale: 1.01 } : undefined}
          whileTap={shouldAnimate && !isDisabled ? { scale: 0.99 } : undefined}
          transition={getSpring(spring.snappyButton)}
          className="relative"
        >
          {/* Warm clay glow — radial-gradient falloff (no blur — iOS GPU budget) */}
          {shouldAnimate && !isDisabled && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -inset-1.5 rounded-2xl opacity-60"
              style={
                {
                  background:
                    "radial-gradient(60% 120% at 50% 50%, var(--hero-clay), transparent 72%)",
                } as CSSProperties
              }
            />
          )}
          <Button
            variant="primary"
            size="lg"
            className={cn(
              "relative w-full shadow-elevated",
              isDisabled && "cursor-not-allowed opacity-50"
            )}
            onClick={isDisabled ? undefined : onCheckout}
            disabled={isDisabled}
          >
            {gate.isOpen ? "Proceed to Checkout" : closedText}
          </Button>
        </m.div>

        {hasBlockingIssues && gate.isOpen && (
          <p className="flex items-center justify-center gap-1.5 text-xs text-text-muted">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            Remove unavailable items to checkout
          </p>
        )}

        <Button variant="outline" size="lg" className="w-full" onClick={onClose}>
          Continue Shopping
        </Button>

        {showFullCartLink && (
          <Link
            href="/cart"
            onClick={onClose}
            className={cn(
              "flex items-center justify-center gap-1.5",
              "text-xs font-medium text-text-muted",
              "transition-colors hover:text-primary"
            )}
          >
            <Expand className="h-3.5 w-3.5" />
            View full cart
          </Link>
        )}
      </div>
    </m.div>
  );
}
