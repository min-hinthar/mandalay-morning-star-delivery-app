"use client";

import { Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useDeliveryGate } from "@/lib/hooks/useDeliveryGate";
import { DeliveryCountdown } from "./DeliveryCountdown";

// ============================================
// TYPES
// ============================================

export interface DeliveryBannerProps {
  cutoffDay: number;
  cutoffHour: number;
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Slim persistent banner for the menu page.
 * Positioned sticky below MenuHeader (top-14).
 * Open state: countdown with urgency colors. Closed state: next delivery date.
 */
export function DeliveryBanner({ cutoffDay, cutoffHour, className }: DeliveryBannerProps) {
  const { isOpen, deliveryDate, cutoffDate, urgency } = useDeliveryGate(cutoffDay, cutoffHour);

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
