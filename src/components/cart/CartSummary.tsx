"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Check, Info, Truck } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { FREE_DELIVERY_THRESHOLD_CENTS } from "@/types/cart";
import { progressSpring } from "@/lib/micro-interactions";

interface CartSummaryProps {
  className?: string;
  showEstimate?: boolean;
}

export function CartSummary({ className, showEstimate = true }: CartSummaryProps) {
  const {
    itemsSubtotal,
    estimatedDeliveryFee,
    formattedSubtotal,
    formattedDeliveryFee,
    formattedTotal,
    amountToFreeDelivery,
  } = useCart();

  const hasFreeDelivery = estimatedDeliveryFee === 0;
  const progressPercent = Math.min(
    (itemsSubtotal / FREE_DELIVERY_THRESHOLD_CENTS) * 100,
    100
  );

  return (
    <div className={cn("space-y-4", className)}>
      {!hasFreeDelivery && (
        <FreeDeliveryProgress
          amountRemaining={amountToFreeDelivery}
          progressPercent={progressPercent}
        />
      )}

      <div className="space-y-2.5 text-sm">
        <SummaryLine label="Subtotal" value={formattedSubtotal} />
        <SummaryLine
          label="Delivery"
          value={hasFreeDelivery ? "FREE" : formattedDeliveryFee}
          valueClassName={hasFreeDelivery ? "text-[var(--color-status-success)] font-semibold" : ""}
          icon={
            hasFreeDelivery ? (
              <Check className="h-4 w-4 text-[var(--color-status-success)]" />
            ) : (
              <Truck className="h-4 w-4 text-[var(--color-text-secondary)]" />
            )
          }
        />
      </div>

      <div className="border-t border-[var(--color-border)]" />

      <div className="flex items-center justify-between">
        <span className="font-bold text-[var(--color-text-primary)]">
          {showEstimate ? "Estimated Total" : "Total"}
        </span>
        <span className="text-xl font-bold text-[var(--color-interactive-primary)]">{formattedTotal}</span>
      </div>

      {showEstimate && (
        <p className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] rounded-lg px-3 py-2">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <span>Final total calculated at checkout. Tax not included.</span>
        </p>
      )}
    </div>
  );
}

interface SummaryLineProps {
  label: string;
  value: string;
  valueClassName?: string;
  icon?: ReactNode;
}

function SummaryLine({ label, value, valueClassName, icon }: SummaryLineProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
        {icon}
        {label}
      </span>
      <span className={valueClassName}>{value}</span>
    </div>
  );
}

interface FreeDeliveryProgressProps {
  amountRemaining: number;
  progressPercent: number;
}

function FreeDeliveryProgress({
  amountRemaining,
  progressPercent,
}: FreeDeliveryProgressProps) {
  return (
    <div className="rounded-xl border border-[var(--color-status-warning)]/30 bg-[var(--color-status-warning-bg)] p-4">
      <div className="flex items-center gap-2">
        <Truck className="h-5 w-5 text-[var(--color-status-warning)]" />
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
          Add <span className="text-[var(--color-status-warning)] font-bold">{formatPrice(amountRemaining)}</span> more for{" "}
          <span className="font-bold text-[var(--color-interactive-primary)]">FREE delivery!</span>
        </p>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--color-status-warning)]/20">
        <motion.div
          className="h-full bg-[var(--color-status-warning)]"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={progressSpring}
        />
      </div>
      <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
        Free delivery on orders $100+
      </p>
    </div>
  );
}
