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
// CART FOOTER — warm-paper panel (After Dark)
// ============================================

interface CartFooterProps {
  onClose: () => void;
  onCheckout: () => void;
  hasBlockingIssues?: boolean;
  showFullCartLink?: boolean;
  /** Multi-day delivery configs from DB */
  deliveryDays?: DeliveryDayConfig[];
  /** @deprecated Legacy cutoff day (0=Sun..6=Sat). Use deliveryDays. */
  cutoffDay?: number;
  /** @deprecated Legacy cutoff hour (0-23). Use deliveryDays. */
  cutoffHour?: number;
}

export function CartFooter({
  onClose,
  onCheckout,
  hasBlockingIssues = false,
  showFullCartLink,
  deliveryDays,
  cutoffDay = 5,
  cutoffHour = 15,
}: CartFooterProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  // Use multi-day gate if deliveryDays available, fallback to legacy
  const hasMultiDay = deliveryDays && deliveryDays.length > 0;
  const multiDayGate = useDeliveryGateMultiDay(deliveryDays ?? []);
  const legacyGate = useDeliveryGate(cutoffDay, cutoffHour);
  const gate = hasMultiDay ? multiDayGate : legacyGate;

  const isDisabled = hasBlockingIssues || !gate.isOpen;
  const closedText =
    hasMultiDay && gate.deliveryDayOfWeek !== undefined
      ? getNextCutoffText(gate.deliveryDayOfWeek, deliveryDays!)
      : `Checkout opens Friday at 3:00 PM`;

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{ delay: 0.2 }}
      className="menu-sheet-footer shrink-0 border-t border-border px-5 py-4"
    >
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

      <div className="mt-4 flex flex-col gap-3">
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

export default CartFooter;
