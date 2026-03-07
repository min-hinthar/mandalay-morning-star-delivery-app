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
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Slim persistent banner for the menu page.
 * Positioned sticky below MenuHeader (top-14).
 * Open state: countdown with urgency colors. Closed state: next delivery date.
 *
 * Supports both legacy single-day (cutoffDay/cutoffHour) and multi-day (deliveryDays) modes.
 */
export function DeliveryBanner({
  cutoffDay,
  cutoffHour,
  deliveryDays,
  className,
}: DeliveryBannerProps) {
  // Use multi-day gate if deliveryDays provided, otherwise legacy
  const multiDayGate = useDeliveryGateMultiDay(deliveryDays ?? []);
  const legacyGate = useDeliveryGate(cutoffDay ?? 5, cutoffHour ?? 15);

  const gate = deliveryDays && deliveryDays.length > 0 ? multiDayGate : legacyGate;
  const { isOpen, deliveryDate, cutoffDate, urgency } = gate;

  return (
    <div
      className={cn(
        "sticky top-14 z-10 border-b",
        "flex items-center justify-center gap-2 px-4 py-2 text-sm",
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
          ? `Ordering open. Delivering ${deliveryDate.displayDate}.`
          : `Ordering closed. Next delivery ${deliveryDate.displayDate}.`
      }
    >
      {isOpen ? (
        <>
          <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="font-medium">Delivering {deliveryDate.displayDate}</span>
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
