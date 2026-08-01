"use client";

import { Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useDeliveryGate, useDeliveryGateMultiDay } from "@/lib/hooks/useDeliveryGate";
import { DeliveryCountdown } from "./DeliveryCountdown";
import type { DeliveryDayConfig } from "@/types/delivery";

// ============================================
// TYPES
// ============================================

export interface DeliveryBannerProps {
  /** @deprecated Use deliveryDays instead */
  cutoffDay?: number;
  /** @deprecated Use deliveryDays instead */
  cutoffHour?: number;
  /** Multi-day delivery config (preferred) */
  deliveryDays?: DeliveryDayConfig[];
  /**
   * Personalized route-day headline ("We're driving the West Route this
   * Wednesday") — replaces the generic "Delivering {date}" lead when the
   * caller resolved the customer's own route. Null/omitted keeps generic copy.
   */
  routeHeadline?: string | null;
  /**
   * The delivery date (YYYY-MM-DD) the headline was derived from. The headline
   * and the countdown run on INDEPENDENT clocks — the headline's awareness is
   * recomputed on useCustomerDeliveryDays' fixed 60s tick, while this banner's
   * gate self-schedules down to 10s near a cutoff — so right after a cutoff
   * rolls, the gate can already say Saturday while the headline still says
   * "this Wednesday". Passing the headline's own date lets the banner detect
   * the disagreement and fall back to the generic (always self-consistent)
   * lead until the headline catches up. Omit to skip the check.
   */
  routeHeadlineDate?: string | null;
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Slim delivery/cutoff banner for the menu page. In-flow (NOT sticky): it sits
 * in the scroll-away masthead so it doesn't fight the global header + the pinned
 * category rail for the top edge (that stacking conflict left it mis-layered).
 * Open state: countdown with urgency colors. Closed state: next delivery date.
 *
 * Supports both legacy single-day (cutoffDay/cutoffHour) and multi-day (deliveryDays) modes.
 */
export function DeliveryBanner({
  cutoffDay,
  cutoffHour,
  deliveryDays,
  routeHeadline,
  routeHeadlineDate,
  className,
}: DeliveryBannerProps) {
  // Use multi-day gate if deliveryDays provided, otherwise legacy
  const multiDayGate = useDeliveryGateMultiDay(deliveryDays ?? []);
  const legacyGate = useDeliveryGate(cutoffDay ?? 5, cutoffHour ?? 15);

  const gate = deliveryDays && deliveryDays.length > 0 ? multiDayGate : legacyGate;
  const { isOpen, deliveryDate, cutoffDate, urgency } = gate;

  // Only lead with the headline while it agrees with the clock driving the
  // countdown beside it — otherwise the banner reads "this Wednesday" next to a
  // 71-hour Saturday countdown for up to a minute after a cutoff rolls.
  const headline =
    routeHeadline && (!routeHeadlineDate || routeHeadlineDate === deliveryDate.dateString)
      ? routeHeadline
      : null;

  return (
    <div
      className={cn(
        "border-b",
        "flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 px-4 py-2 text-sm",
        isOpen && urgency === "normal" && "bg-surface-secondary border-border text-text-secondary",
        isOpen &&
          urgency === "warning" &&
          "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400",
        isOpen &&
          urgency === "critical" &&
          "bg-destructive/10 border-destructive/20 text-destructive",
        !isOpen && "bg-surface-secondary border-border text-text-secondary",
        className
      )}
      role="status"
      aria-label={
        isOpen
          ? `Ordering open. ${headline ? `${headline}. ` : ""}Delivering ${deliveryDate.displayDate}.`
          : `Ordering closed. Next delivery ${deliveryDate.displayDate}.`
      }
    >
      {isOpen ? (
        <>
          <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="font-medium">
            {/* Personalized: name the customer's route so the invite email's
                promise ("we're driving your way") survives landing here */}
            {headline ?? `Delivering ${deliveryDate.displayDate}`}
            {headline && (
              <span className="font-burmese font-normal text-xs" lang="my">
                {" "}
                · သင့်ဒေသသို့
              </span>
            )}
          </span>
          <span aria-hidden="true" className="text-text-muted">
            &mdash;
          </span>
          <span className="text-text-muted text-xs">Order cutoff in</span>
          <DeliveryCountdown cutoffDate={cutoffDate} urgency={urgency} />
        </>
      ) : (
        <>
          <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="font-medium">Next delivery: {deliveryDate.displayDate}</span>
        </>
      )}
    </div>
  );
}
