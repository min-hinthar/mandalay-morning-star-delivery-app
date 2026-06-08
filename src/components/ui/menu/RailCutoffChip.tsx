"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useDeliveryGate, useDeliveryGateMultiDay } from "@/lib/hooks/useDeliveryGate";
import { DeliveryCountdown } from "@/components/ui/delivery/DeliveryCountdown";
import type { DeliveryDayConfig } from "@/types/delivery";

export interface RailCutoffChipProps {
  /** @deprecated Use deliveryDays instead */
  cutoffDay?: number;
  /** @deprecated Use deliveryDays instead */
  cutoffHour?: number;
  /** Multi-day delivery config (preferred) */
  deliveryDays?: DeliveryDayConfig[];
  className?: string;
}

/**
 * RailCutoffChip — the always-visible, condensed delivery cutoff in the pinned
 * rail (the full countdown banner lives in the scroll-away masthead). A live,
 * urgency-tinted pill so the order deadline stays in view while browsing.
 *
 * Compact: shows just the live countdown when ordering is open, or a muted
 * "Closed" when past cutoff. Hidden below sm to protect the tabs' width.
 */
export function RailCutoffChip({
  cutoffDay,
  cutoffHour,
  deliveryDays,
  className,
}: RailCutoffChipProps) {
  const multiDayGate = useDeliveryGateMultiDay(deliveryDays ?? []);
  const legacyGate = useDeliveryGate(cutoffDay ?? 5, cutoffHour ?? 15);
  const gate = deliveryDays && deliveryDays.length > 0 ? multiDayGate : legacyGate;
  const { isOpen, cutoffDate, urgency } = gate;

  return (
    <div
      className={cn(
        "menu-rail-chip hidden shrink-0 items-center gap-1.5 rounded-pill px-3 py-1.5 sm:flex",
        "text-xs font-semibold",
        isOpen && urgency === "normal" && "text-text-secondary",
        isOpen && urgency === "warning" && "menu-rail-chip-warn text-hero-clay",
        isOpen && urgency === "critical" && "menu-rail-chip-crit text-destructive",
        !isOpen && "text-text-muted",
        className
      )}
    >
      {/* No role="status" here: DeliveryCountdown owns the polite live region
          when open (avoids nested live regions); "Closed" is static text. */}
      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="sr-only">{isOpen ? "Time left to order:" : "Ordering closed"}</span>
      {isOpen ? (
        <DeliveryCountdown cutoffDate={cutoffDate} urgency={urgency} className="tabular-nums" />
      ) : (
        <span>Closed</span>
      )}
    </div>
  );
}

export default RailCutoffChip;
