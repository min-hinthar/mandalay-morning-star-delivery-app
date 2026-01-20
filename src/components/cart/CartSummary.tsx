"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Check, Info, Truck } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { FREE_DELIVERY_THRESHOLD_CENTS } from "@/types/cart";
import { v6Spring } from "@/lib/motion";

interface CartSummaryProps {
  className?: string;
  showEstimate?: boolean;
}

/**
 * V6 Cart Summary - Pepper Aesthetic
 * Displays cart totals with V6 styling and free delivery progress
 */
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

      <div className="space-y-2.5 font-v6-body text-sm">
        <SummaryLine label="Subtotal" value={formattedSubtotal} />
        <SummaryLine
          label="Delivery"
          value={hasFreeDelivery ? "FREE" : formattedDeliveryFee}
          valueClassName={hasFreeDelivery ? "text-v6-green font-semibold" : ""}
          icon={
            hasFreeDelivery ? (
              <Check className="h-4 w-4 text-v6-green" />
            ) : (
              <Truck className="h-4 w-4 text-v6-text-muted" />
            )
          }
        />
      </div>

      <div className="border-t border-v6-border" />

      <div className="flex items-center justify-between">
        <span className="font-v6-display font-bold text-v6-text-primary">
          {showEstimate ? "Estimated Total" : "Total"}
        </span>
        <span className="text-xl font-v6-display font-bold text-v6-primary">{formattedTotal}</span>
      </div>

      {showEstimate && (
        <p className="flex items-start gap-2 text-xs text-v6-text-secondary bg-v6-surface-secondary rounded-v6-input px-3 py-2">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-v6-teal" />
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
      <span className="flex items-center gap-1.5 text-v6-text-secondary">
        {icon}
        {label}
      </span>
      <span className={cn("text-v6-text-primary", valueClassName)}>{value}</span>
    </div>
  );
}

interface FreeDeliveryProgressProps {
  amountRemaining: number;
  progressPercent: number;
}

/**
 * V6 Free Delivery Progress Bar - Pepper Aesthetic
 * Shows progress towards free delivery threshold with V6 colors
 */
function FreeDeliveryProgress({
  amountRemaining,
  progressPercent,
}: FreeDeliveryProgressProps) {
  return (
    <div className="rounded-v6-card-sm border border-v6-secondary/30 bg-v6-secondary-light p-4">
      <div className="flex items-center gap-2">
        <Truck className="h-5 w-5 text-v6-secondary" />
        <p className="text-sm font-v6-body font-semibold text-v6-text-primary">
          Add <span className="text-v6-orange font-bold">{formatPrice(amountRemaining)}</span> more for{" "}
          <span className="font-bold text-v6-primary">FREE delivery!</span>
        </p>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-v6-pill bg-v6-secondary/20">
        <motion.div
          className="h-full bg-v6-secondary"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={v6Spring}
        />
      </div>
      <p className="mt-2 text-xs text-v6-text-muted">
        Free delivery on orders $100+
      </p>
    </div>
  );
}
